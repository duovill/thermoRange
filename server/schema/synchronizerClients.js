'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SynchronizerClients = new Schema({
	token: { // a token, amivel a kliens azonosítja magát
		type: String,
		required: true,
		// unique: true
	},
	id: {
		type: String,
		require: true
	},
	name: { //kliens neve
		type: String,
		require: true,
		// unique: true
	},
	enabled: {
		type: Boolean,
		default: true
	},
	lastSeen: Number,
	lastSync: Number,
	online:Boolean
}, {
	timestamps: true
});

SynchronizerClients.index({token: 1},{unique:true});

module.exports = SynchronizerClients;
