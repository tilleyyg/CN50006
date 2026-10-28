
const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const {
    insertOne,
    findAll,
    countDocuments,
    findFemalesOver30,
    deleteManyPersons,
    updateManyPersons
} = require('./Week4Lab');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
let dbReady = false;

if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => {
            dbReady = true;
            console.log('Connected to MongoDB');
        })
        .catch(err => {
            console.error('MongoDB connection error:', err.message);
        });
} else {
    console.warn(
        'MONGO_URI is not configured. Database routes will not work.'
    );
}

// Check database connection
function requireDatabase(req, res, next) {
    if (!dbReady || mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            status: false,
            message: 'Database is not connected. Check MONGO_URI.'
        });
    }

    next();
}

// Home route
app.get('/', (req, res) => {
    res.send('Hello! This is my first Express application.');
});

// About route
app.get('/about', (req, res) => {
    res.send('This is a basic Express application');
});

// URL parameters example
app.get('/users/:userId/books/:bookId', (req, res) => {
    res.json(req.params);
});

// Get all students
app.get('/GetStudents', (req, res) => {
    fs.readFile(path.join(__dirname, 'Students.json'), 'utf8',
        (err, data) => {
            if (err) {
                return res.status(500).json({
                    status: false,
                    message: 'Error reading Students.json'
                });
            }

            try {
                res.status(200).json({
                    status: true,
                    statusCode: 200,
                    requestedAt: new Date().toISOString(),
                    requestUrl: req.originalUrl,
                    requestMethod: req.method,
                    studentData: JSON.parse(data)
                });
            } catch (error) {
                res.status(500).json({
                    status: false,
                    message: 'Invalid JSON in Students.json'
                });
            }
        }
    );
});

// Get one student by ID
app.get('/GetStudent/:id', (req, res) => {
    fs.readFile(path.join(__dirname, 'Students.json'), 'utf8',
        (err, data) => {
            if (err) {
                return res.status(500).json({
                    status: false,
                    message: 'Error reading Students.json'
                });
            }

            try {
                const students = JSON.parse(data);
                const student = students['Student' + req.params.id];

                if (student) {
                    return res.status(200).json(student);
                }

                return res.status(404).json({
                    status: false,
                    statusCode: 404,
                    message: 'Student Not Found',
                    requestedAt: new Date().toISOString(),
                    requestUrl: req.originalUrl,
                    requestMethod: req.method
                });
            } catch (error) {
                return res.status(500).json({
                    status: false,
                    message: 'Invalid JSON in Students.json'
                });
            }
        }
    );
});

// Display student form
app.get('/studentinfo', (req, res) => {
    res.sendFile(path.join(__dirname, 'StudentInfo.html'));
});

// Handle student form submission
app.post('/submit-data', (req, res) => {
    const name =
        `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim();

    const qualifications = req.body.Qual
        ? Array.isArray(req.body.Qual)
            ? req.body.Qual
            : [req.body.Qual]
        : [];

    res.status(200).json({
        status: true,
        message: 'Form Details',
        data: {
            name: name,
            email: req.body.email,
            age: req.body.myAge,
            gender: req.body.gender,
            qualification: qualifications
        }
    });
});

// Display employee form
app.get('/Showform', (req, res) => {
    res.sendFile(path.join(__dirname, 'PersonForm.html'));
});

// Insert one employee
app.post('/insertOne', requireDatabase, async (req, res) => {
    try {
        const { name, age, gender, salary } = req.body;

        if (
            !name ||
            age === undefined ||
            age === '' ||
            !gender ||
            salary === undefined ||
            salary === ''
        ) {
            return res.status(400).json({
                status: false,
                message: 'Provide name, age, gender and salary.'
            });
        }

        const result = await insertOne(name, age, gender, salary);

        res.status(201).json({
            status: true,
            message: 'Person inserted successfully',
            data: result
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: err.message
        });
    }
});

// Find all employees
app.get('/persons', requireDatabase, async (req, res) => {
    try {
        const result = await findAll();
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({
            status: false,
            message: err.message
        });
    }
});

// Find female employees aged 30 or above
app.get('/persons/females-over-30', requireDatabase,
    async (req, res) => {
        try {
            const result = await findFemalesOver30();
            res.status(200).json(result);
        } catch (err) {
            res.status(500).json({
                status: false,
                message: err.message
            });
        }
    }
);

// Count employees
app.get('/persons/count', requireDatabase, async (req, res) => {
    try {
        const result = await countDocuments();

        res.status(200).json({
            status: true,
            totalEmployees: result
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: err.message
        });
    }
});

// Update employees matching a condition
app.put('/persons/update', requireDatabase, async (req, res) => {
    try {
        const { condition, updates } = req.body;

        if (
            !condition ||
            !updates ||
            typeof condition !== 'object' ||
            typeof updates !== 'object' ||
            Array.isArray(condition) ||
            Array.isArray(updates) ||
            Object.keys(condition).length === 0 ||
            Object.keys(updates).length === 0
        ) {
            return res.status(400).json({
                status: false,
                message: 'Provide condition and updates objects.'
            });
        }

        const result = await updateManyPersons(condition, updates);

        res.status(200).json({
            status: true,
            message: 'Update completed',
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: err.message
        });
    }
});

// Delete employees matching a condition
app.delete('/persons/delete', requireDatabase, async (req, res) => {
    try {
        const { condition } = req.body;

        if (
            !condition ||
            typeof condition !== 'object' ||
            Array.isArray(condition) ||
            Object.keys(condition).length === 0
        ) {
            return res.status(400).json({
                status: false,
                message: 'Provide a condition object.'
            });
        }

        const result = await deleteManyPersons(condition);

        res.status(200).json({
            status: true,
            message: 'Delete completed',
            deletedCount: result.deletedCount
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: err.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

