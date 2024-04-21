/**
 * Author: Jacob Russell
 * Description: goat website server
 */

const express = require("express");
const app = express();
const Joi = require("joi");
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(express.json());
const cors = require("cors");
const corsOptions = {
	origin: "https://jacobusc.github.io",
	methods: ["GET","PUT","POST","DELETE"],
	preflightContinue: false,
  	optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

const mongoose = require("mongoose");

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

const validateDeck = (deck) => {
	const schema = Joi.object({
		_id: Joi.allow(""),
		deckName: Joi.string().min(3).max(20).required(),
		userName: Joi.string().min(3).max(20).required(),
		email: Joi.string().email().required(),
		featuredCard: Joi.number().required(),
		description: Joi.string().min(3).max(2000),
		deck: Joi.array().min(40).max(100).required(),
		extra: Joi.array().min(0).max(100)
	});
	return schema.validate(deck);
};

app.get("/api/decks", async (req, res) => {
	res.send(await Deck.find());
});

app.post("/api/decks", async (req, res) => {
	console.log("Starting Post");
	console.log(req.body);
	const result = validateDeck(req.body);
	if (result.error) {
		res.status(400).send(result.error.details[0].message);
		return;
	}
	const deck = new Deck ({
		deckName: req.body.deckName,
		userName: req.body.userName,
		email: req.body.email,
		featuredCard: req.body.featuredCard,
		description: req.body.description,
		deck: req.body.deck,
		extra: req.body.extra
	});
	await deck.save();
	res.send(deck);
	console.log("Successfully Posted");
});

app.put("/api/decks/:id", async (req, res) => {
	console.log("Starting Put");
	const result = validateDeck(req.body);
	// additional testing todo
	res.send(await Deck.updateOne({_id:req.body.id},updateFields));
	console.log("Successfully Put");
});

app.delete("/api/decks/:id", async (req, res) => {
	res.send(await Deck.findByIdAndDelete(req.body.id));
});

app.listen(3000, () => {
	console.log("listening");
});
