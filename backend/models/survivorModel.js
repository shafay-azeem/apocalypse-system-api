const mongoose = require('mongoose');
const survivorSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    age: {
        type: String,
    },
    gender: {
        type: String,
    },
    flagInfected: {
        type: Number,
        default: 0
    },
    location: [
        {
            latitude: {
                type: String
            },
            longitude: {
                type: String
            }
        }
    ],
    resources: [
        {
            item: {
                type: String,
            },
            points: {
                type: Number,
            },
            qty: {
                type: Number
            }
        },
    ],

}, { timestamps: true });
const Survivor = mongoose.model('Survivor', survivorSchema);
module.exports = Survivor;