
const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    salary: { type: Number, required: true }
});

const Person = mongoose.model('Person', personSchema, 'persons');

async function insertOne(name, age, gender, salary) {
    return await Person.create({
        name,
        age: Number(age),
        gender,
        salary: Number(salary)
    });
}

async function insertMany(people) {
    return await Person.insertMany(people);
}

async function findAll() {
    return await Person.find();
}

async function findFemalesOver30() {
    return await Person.find({
        gender: { $regex: /^female$/i },
        age: { $gte: 30 }
    });
}

async function countDocuments() {
    return await Person.countDocuments();
}

async function deleteManyPersons(condition) {
    return await Person.deleteMany(condition);
}

async function updateManyPersons(condition, updates) {
    return await Person.updateMany(condition, { $set: updates });
}

module.exports = {
    insertOne,
    insertMany,
    findAll,
    findFemalesOver30,
    countDocuments,
    deleteManyPersons,
    updateManyPersons
};
