/**
 * Author: Jacob Russell
 * Description: goat website server
 */

/**
 * Card list is obtained from the Yu-Gi-Oh! API by YGOPRODeck
 * Using API v7
 * https://ygoprodeck.com/api-guide/
 */

const express = require("express");
const app = express();
const Joi = require("joi");
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(express.json());
const cors = require("cors");
app.use(cors());
const mongoose = require("mongoose");

//update to new database
mongoose
  .connect("mongodb+srv://jrr18:Agb891pEWc9zm5z6@assignment16.rfydwdh.mongodb.net/?retryWrites=true&w=majority&appName=assignment16")
  .then(() => {
	console.log("connected to mongodb");
  })
  .catch((error) => {
	console.log("couldn't connect to mongodb", error);
  });

const deckSchema = new mongoose.Schema({
	deckName: String,
	userName: String,
	email: String,
	featuredCard: Number,
	description: String,
	deck: [Number],
	extra: [Number]
});

const Deck = mongoose.model("Deck", deckSchema);

//get card ids for data validation
const cardIDList = [];

const getCards = async () => {
	const url = "https://db.ygoprodeck.com/api/v7/cardinfo.php?&enddate=2005-09-30&dateregion=tcg";
	try {
		const response = await fetch(url);
		return response.json();
	} catch (error) {
		console.log(error);
	}
};

const getIDs = async () => {
	const cardsJSON = await getCards();
	cardsJSON.data.forEach((card) => {
		cardIDList.push(card.id);
	});
};

const validateDeck = (deck) => {
	const schema = Joi.object({
		_id: Joi.allow(""),
		deckName: Joi.string().min(3).max(20).required(),
		userName: Joi.string().min(3).max(20).required(),
		email: Joi.string().email().required(),
		featuredCard: Joi.number().required(),
		description: Joi.string().min(3).max(200),
		deck: Joi.array().min(40).max(100).required(),
		extra: Joi.array().min(0).max(100)
	});
	return schema.validate(deck);
};

app.get("/api/decks", async (req, res) => {
	res.send(await Deck.find());
});

app.post("/api/decks", async (req, res) => {
	const result = validateDeck(req.body);
	if (result.error) {
		res.status(400).send(result.error.details[0].message);
		return;
	}
	if (!cardIDList.includes(req.body.featuredCard)) {
		res.status(400).send("Invalid Featured Card");
		return;
	}
	req.body.deck.forEach((id) => {
		if (!cardIDList.includes(id)) {
			res.status(400).send("Invalid Deck Card");
			return;
		}
	});
	if (!(req.body.extra === undefined) && !(req.body.extra == 0)) {
		req.body.forEach((id) => {
			if (!cardIDList.includes(id)) {
				res.status(400).send("Invalid Fusion Deck Card");
				return;
			}
		});
	}
	const deck = new Deck ({
		deckName: req.body.deckName,
		userName: req.body.userName,
		email: req.body.email,
		featuredCard: req.body.featuredCard,
		description: req.body.description,
		deck: req.body.deck.split(","),
		extra: req.body.extra.split(",")
	});
	await deck.save();
	res.send(deck);
});

app.put("/api/decks/:id", async (req, res) => {
	const result = validateDeck(req.body);
	// additional testing todo
	res.send(await Deck.updateOne({_id:req.params.id},updateFields));
});

app.delete("/api/decks/:id", async (req, res) => {
	res.send(await Deck.findByIdAndDelete(req.params.id));
});

app.listen(3000, () => {
	console.log("listening");
});