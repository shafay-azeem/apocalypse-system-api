const Survivor = require("../models/survivorModel");
const asyncHandler = require("express-async-handler");



//Create Survivor -- POST
exports.survivorCreate = asyncHandler(async (req, res, next) => {
    // Destructuring the data from the request body
    const { name, age, gender, location, resources } = req.body;
    try {

        // Creating a new survivor in the database using the Survivor model
        let survivor = await Survivor.create({
            name,
            age,
            gender,
            location,
            resources
        });

        // Returning a success response with the created survivor and a message
        return res.status(201).json({
            success: true,
            survivor,
            message: "Survivor Created Successfully",
        });
    } catch (err) {
        // Handling any errors that occur during the process
        if (!err.statusCode) {
            // If the error does not have a status code, set it to 500 (Internal Server Error)
            err.statusCode = 500;
        }
        next(err);
    }
});


//Update location ---PUT
exports.updateLocation = asyncHandler(async (req, res, next) => {

    // Getting the survivor ID from the request parameters
    let survivorId = req.params.survivorId
    const { location } = req.body;
    // Creating a new object with the updated location data
    const newSurvivortData = {
        location: location,
    };
    try {
        // Updating the location of the survivor with the given ID
        const survivor = await Survivor.findByIdAndUpdate(survivorId, newSurvivortData, {
            new: true,
            runValidators: true,
            useFindAndModify: false,
        });
        // Retrieving the updated location data and returning a success response
        let location = await survivor.location
        return res.status(200).json({
            success: true,
            location,
            message: "Survivor Location Updated Successfuly"
        });
    } catch (err) {
        // Handling any errors that occur during the process
        if (!err.statusCode) {
            // If the error does not have a status code, set it to 500 (Internal Server Error)
            err.statusCode = 500;
        }
        next(err);
    }
});


//Infected Flag--Post
exports.flagInfected = asyncHandler(async (req, res, next) => {
    // Getting the IDs of the non-infected and infected survivors from the request parameters and query string respectively
    let nonInfected = req.params.nonInfected
    let infected = req.query.infected
    try {

        // Finding the survivor with the given infected ID
        let survivor = await Survivor.findById(infected);
        if (!survivor) {
            // If the survivor is not found, throwing an error with a 404 status code
            const error = new Error('survivor Not Found')
            error.statusCode = 404
            throw error
        }


        if (survivor.flagInfected >= 3) {
            const error = new Error("Infected Survivor Cant Update His Location")
            error.statusCode = 405
            throw error
        }
        // Incrementing the flagInfected count of the survivor by 1
        let count = survivor.flagInfected + 1
        let newSurvivortData = {
            flagInfected: count,
        };
        // Updating the survivor with the given infected ID with the new flagInfected count
        survivor = await Survivor.findByIdAndUpdate(infected, newSurvivortData, {
            new: true,
            runValidators: true,
            useFindAndModify: false,
        });

        // Returning a success response with the updated survivor and a message indicating whether or not they are infected
        return res.status(200).json({
            success: true,
            survivor,
            message: count >= 3 ? ("Infected") : ("Not Infected")

        });
    } catch (err) {
        // Handling any errors that occur during the process
        if (!err.statusCode) {
            // If the error does not have a status code, set it to 500 (Internal Server Error)
            err.statusCode = 500;
        }
        next(err);
    }
});


//Trasaction Api --Post
exports.tradeItems = asyncHandler(async (req, res, next) => {
    try {
        const { survivor1Id, survivor2Id, itemsToTrade } = req.body;

        const survivor1 = await Survivor.findById(survivor1Id);
        const survivor2 = await Survivor.findById(survivor2Id);


        if (survivor1.flagInfected >= 3) {
            const error = new Error("survivor1 is infected, You cant do Trade with him")
            error.statusCode = 405 //method not allowed
            throw error
        }

        if (survivor1.flagInfected >= 3) {
            const error = new Error("survivor2 is infected, You cant do Trade with him")
            error.statusCode = 405 //method not allowed
            throw error
        }

        // Calculate total points for each survivor based on their itemsToTrade
        const survivor1Points = calculateTotalPoints(survivor1.resources, itemsToTrade.survivor1);
        const survivor2Points = calculateTotalPoints(survivor2.resources, itemsToTrade.survivor2);
        const survivor1BodyPoints = calculateTotalBodyPoints(itemsToTrade.survivor1);
        const survivor2BodyPoints = calculateTotalBodyPoints(itemsToTrade.survivor2);


        if (survivor1Points < survivor1BodyPoints) {
            return res.status(400).json({ error: 'Survivor 1 Dont this much Items in his inventory to trade.' });
        }
        if (survivor2Points < survivor2BodyPoints) {
            return res.status(400).json({ error: 'Survivor 2 Dont this much Items in his inventory to trade.' });
        }
        if (survivor1BodyPoints !== survivor2BodyPoints) {
            return res.status(400).json({ error: 'Invalid trade. Both sides should offer the same amount of points.' });
        }

        // Update survivor1's resources by removing the items being traded
        for (const item of itemsToTrade.survivor1) {
            const resource = survivor1.resources.find(r => r.item === item.item);
            if (!resource || resource.points * resource.qty < item.points * item.qty) {
                return res.status(400).json({ error: `Survivor1 does not have enough ${item.item}.` });
            }
            resource.qty -= item.qty
            if (resource.qty == 0) {
                survivor1.resources.pull(resource._id)
            }
        }

        // Update survivor2's resources by removing the items being traded
        for (const item of itemsToTrade.survivor2) {
            const resource = survivor2.resources.find(r => r.item === item.item);
            if (!resource || resource.points * resource.qty < item.points * item.qty) {
                return res.status(400).json({ error: `Survivor2 does not have enough ${item.item}.` });
            }
            resource.qty -= item.qty
            if (resource.qty == 0) {
                survivor2.resources.pull(resource._id)
            }
        }

        // Add the traded items to survivor1's resources
        for (const item of itemsToTrade.survivor2) {
            const resource = survivor1.resources.find(r => r.item === item.item);
            if (resource) {
                resource.qty += item.qty
            } else {
                survivor1.resources.push({ item: item.item, points: item.points, qty: item.qty });
            }
        }

        // Add the traded items to survivor2's resources
        for (const item of itemsToTrade.survivor1) {
            const resource = survivor2.resources.find(r => r.item === item.item);
            if (resource) {
                resource.qty += item.qty
            } else {
                survivor2.resources.push({ item: item.item, points: item.points, qty: item.qty });
            }
        }

        // Save updated survivors to the database
        await survivor1.save();
        await survivor2.save();

        return res.json({ message: 'Trade successful.' });

    } catch (err) {
        // Handling any errors that occur during the process
        if (!err.statusCode) {
            // If the error does not have a status code, set it to 500 (Internal Server Error)
            err.statusCode = 500;
        }
        next(err);
    }
});

// Helper function to calculate total points for set of resources in database
function calculateTotalPoints(resources, items) {
    let totalPoints = 0;
    for (const item of items) {
        const resource = resources.find(r => r.item === item.item);
        if (resource) {
            totalPoints += resource.points * resource.qty;
        }
    }
    return totalPoints
}


// Helper function to calculate total points for a given set of resources
function calculateTotalBodyPoints(items) {
    let totalBodyPoints = 0;
    for (const item of items) {
        totalBodyPoints += item.points * item.qty;

    }
    return totalBodyPoints
}

//--------------------------REPORT APIS-------------------------------//


//INFECTED PERCENTAGE ---GET
exports.percentageInfectedSurvivor = asyncHandler(async (req, res, next) => {
    try {
        // Get total number of survivors
        const totalSurvivors = await Survivor.countDocuments();

        // Get number of infected survivors
        const infectedSurvivors = await Survivor.countDocuments({ flagInfected: { $gte: 3 } });

        // Calculate percentage of infected survivors
        const infectedPercentage = (infectedSurvivors / totalSurvivors) * 100;

        res.status(200).json({ infectedPercentage });
    } catch (err) {
        // Handling any errors that occur during the process
        if (!err.statusCode) {
            // If the error does not have a status code, set it to 500 (Internal Server Error)
            err.statusCode = 500;
        }
        next(err);
    }
});



//NON INFECTED PERCENTAGE ---GET
exports.percentageNonInfectedSurvivor = asyncHandler(async (req, res, next) => {
    try {
        // Get total number of survivors
        const totalSurvivors = await Survivor.countDocuments();

        // Get number of  non infected survivors
        const nonInfectedSurvivors = await Survivor.countDocuments({ flagInfected: { $lt: 3 } });

        // Calculate percentage of infected survivors
        const nonInfectedPercentage = (nonInfectedSurvivors / totalSurvivors) * 100;

        res.status(200).json({ nonInfectedPercentage });
    } catch (err) {
        // Handling any errors that occur during the process
        if (!err.statusCode) {
            // If the error does not have a status code, set it to 500 (Internal Server Error)
            err.statusCode = 500;
        }
        next(err);
    }
});


//Points lost because of infected survivor. ---GET
exports.pointLoss = asyncHandler(async (req, res, next) => {
    try {
        const infectedSurvivors = await Survivor.find({ flagInfected: { $gte: 3 } });
        let totalPoints = 0;
        for (const loss of infectedSurvivors) {
            for (const resources of loss.resources) {
                totalPoints += resources.points * resources.qty;
            }


        }
        res.status(200).json({ totalPoints });

    } catch (err) {
        // Handling any errors that occur during the process
        if (!err.statusCode) {
            // If the error does not have a status code, set it to 500 (Internal Server Error)
            err.statusCode = 500;
        }
        next(err);
    }
});


//Average amount ---->GET
exports.averageAmount = asyncHandler(async (req, res, next) => {
    try {
        // Get total number of survivors
        const totalSurvivors = await Survivor.countDocuments();

        // Calculate total points for each resource
        const resources = await Survivor.aggregate([
            {
                $unwind: '$resources'
            },
            {
                $group: {
                    _id: '$resources.item',
                    totalPoints: { $sum: { $multiply: [1, '$resources.qty'] } }
                }
            },
            {
                $project: {
                    _id: 0,
                    item: '$_id',
                    averagePoints: { $divide: ['$totalPoints', totalSurvivors] }
                }
            }
        ]);

        res.status(200).json({ resources });
    } catch (err) {
        // Handling any errors that occur during the process
        if (!err.statusCode) {
            // If the error does not have a status code, set it to 500 (Internal Server Error)
            err.statusCode = 500;
        }
        next(err);
    }
});