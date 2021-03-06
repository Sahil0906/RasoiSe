var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const express = require('express');
const mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;
const requireAuth = require('../middlewares/requireAuth');
const sortObjectsArray = require('sort-objects-array');
var NodeGeocoder = require("node-geocoder");


const User = mongoose.model('User');
const router = express.Router();
router.use(requireAuth);

const models = require('../models/models')

Chef = models.chef;
Menu = models.menu;
Rating = models.rating;
Review = models.review;

const options = require('../../location_creds');
const cons = require("consolidate");
const { review } = require("../models/models");


//-----------------------calculating current time---------------------
function getTime() {
    var currentTime = new Date();
    var currentOffset = currentTime.getTimezoneOffset();
    var ISTOffset = 330;   // IST offset UTC +5:30 
    var ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000);
    var hoursIST = ISTTime.getHours();
    var minutesIST = ISTTime.getMinutes();
    var secondsIST = ISTTime.getSeconds()
    minutesIST = minutesIST < 10 ? '0' + minutesIST : minutesIST;
    hoursIST = hoursIST < 10 ? '0' + hoursIST : hoursIST;
    secondsIST = secondsIST < 10 ? '0' + secondsIST : secondsIST;
    var time = hoursIST + ":" + minutesIST + ":" + secondsIST;
    return time;
}
//-------------------------------------------------------------------

//-----------------------------change 24 to 12----------------

function tConvert(time) {
    if (time == "12:00:00") return "12 PM"
    if (time == "24:00:00" || time == "00:00:00") return "12 AM"
    time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

    if (time.length > 1) {
        time = time.slice(1, 4);
        time[5] = +time[0] < 12 ? ' AM' : ' PM';
        time[0] = +time[0] % 12 || 12;
    }
    return time.join('');
}

//---------------------------------------------------------


router.route("/")
    .get((req, res, next) => {
        res.send(req.user);
    })

    .post(async (req, res, next) => {
        try {
            res.send(req.body.search);

        } catch (error) {
            next(error);
        }
    });

//view all Chefs in the vicinity
router.route("/viewallchefs")
    .post(async (req, res, next) => {
        try {
            //req.body={lat:currentlat, long:currentlong}
            await req.body
            // console.log(req.body)
            await await Chef.aggregate()
                .near({
                    near: {
                        type: "Point",
                        coordinates: [req.body.long, req.body.lat]
                    },
                    maxDistance: 300000,
                    spherical: true,
                    distanceField: "dis"
                }).then(async function (chefs) {
                    res.send({ chefs: chefs })
                })

        } catch (error) {
            next(error);
        }

    })


// Search for home chefs acc to location and sort them acc to rating
router.route("/search")
    .post(async (req, res, next) => {
        try {


            lat = 25.637979
            long = 85.0985654
            var geocoder = NodeGeocoder(options);
            if (req.body.location == "current") {

                lat = req.body.lat;
                long = req.body.long;
            }
            else {
                await geocoder.geocode(req.body.address).then(async function (loc) {

                    lat = loc[0].latitude;
                    long = loc[0].longitude;


                });
            }

            await Chef.aggregate()
                .near({
                    near: {
                        type: "Point",
                        coordinates: [long, lat]
                    },
                    maxDistance: 300000,
                    spherical: true,
                    distanceField: "dis"
                })
                .then(async function (filter_chefs) {
                    var chefs = [];
                    var set1 = new Set()
                    await Menu.find({ name: new RegExp(req.body.query.toLowerCase()) }).then(function (result) {
                        // console.log(result)
                        for (var i of result) {
                            set1.add((i.chef._id).toString())

                        }
                    })

                    //search with name
                    for (var i of filter_chefs) {
                        n = (i.name).toString().toLowerCase()
                        if (n.includes(req.body.query.toLowerCase())) {
                            set1.add((i._id).toString())

                        }

                    }

                    for (var i of filter_chefs) {
                        idd = (i._id).toString()
                        if (set1.has(idd)) {
                            await Chef.findById(i).then(async function (data) {
                                chefs.push(data)

                            });
                        }
                    }

                    chefs = sortObjectsArray(chefs, 'rating', 'desc');
                    // console.log(chefs)
                    geocoder.reverse({ lat: lat, lon: long })
                        .then((data) => {
                            // console.log("chefs", chefs)
                            res.send({ chefs: chefs, location: data[0].formattedAddress })
                        })

                });

        } catch (error) {
            next(error);
        }
    })

//page to display particular dishes by a chef(example chicken dishes by tonio)    
router.route("/yourdishes")
    .post(async (req, res, next) => {
        try {

            //req.body={chefid,query,toggle:on or off}

            key = req.body.toggle
            if (key == "on") {
                await Menu.find({ chef: req.body.chefid, name: new RegExp(req.body.query.toLowerCase()), category: "veg" }).then(async function (data) {
                    res.send({ dishes: data })
                })

            } else {
                await Menu.find({ chef: req.body.chefid, name: new RegExp(req.body.query.toLowerCase()) }).then(async function (data) {
                    res.send({ dishes: data })
                })

            }

        } catch (error) {
            next(error);
        }

    })

//filter dishes of a chef with category
router.route("/filterdish/")
    .post(async (req, res, next) => {
        try {
            // req.body={chefid:chefs id, filter:veg/nonveg}

            await Menu.find({ chef: req.body.chefid, category: "veg" }).then(async function (data) {
                res.send({ dishes: data })
            })

        } catch (error) {
            next(error);
        }

    })



//View all dishes by a particular chef
router.route("/chef/:query")
    .get(async (req, res, next) => {
        try {
            current_time = getTime()
            availability = 'no'
            slots = []
            menu = await Menu.find({ chef: req.params.query })

            // chef_details = await Chef.findById(req.params.query)

            await Chef.findById(req.params.query).then(async function (chef_details) {
                await chef_details;

                for (var interval of chef_details.slot) {
                    start_time = interval.split('-')[0]
                    end_time = interval.split('-')[1]

                    if (current_time > start_time && current_time < end_time) {
                        availability = 'yes'

                    }
                    start_conv = tConvert(start_time)
                    end_conv = tConvert(end_time)
                    slots.push(start_conv + " to " + end_conv)

                }

                res.send({ chef_details: chef_details, menu: menu, availability: availability, slots: slots })
            })



        } catch (error) {
            next(error);
        }

    })


//change average rating of chef when a user rates
router.route("/changerating")
    .post(async (req, res, next) => {
        try {
            // req.body={id:chef's id,rate:user's entered rating}

            //check if user has already rated the chef-update otherwise create new
            await Rating.find({ user: req.user._id, chef: req.body.id }).then(async function (data) {
                console.log(data)
                if (data.length == 0) {
                    console.log('create new')
                    rating1 = new Rating({
                        chef: req.body.id,
                        user: req.user._id,
                        rating: parseInt(req.body.rate)
                    })

                    await rating1.save()

                }
                else {
                    data[0].rating = req.body.rate;
                    await data[0].save()
                    console.log('update')
                }
            })



            await Chef.findById(req.body.id).then(async function (data) {
                // await Rating.find({ chef: req.body.id }).then(async function (rates) {
                // })
                await Rating.aggregate(
                    [

                        {
                            "$match": {
                                chef: ObjectId(req.body.id)
                            }
                        },
                        {
                            "$group": {
                                _id: "$chef",
                                average: { $avg: "$rating" },
                                add: { $sum: "$rating" },
                                count: { $sum: 1 }
                            }
                        },

                    ],
                    async function (err, results) {
                        await results
                        // console.log(results);
                        finalavg = (results[0].add + parseInt(req.body.rate)) / ((results[0].count) + 1)
                        final = Math.round(finalavg * 2) / 2
                        data.rating = final
                        data.save()
                        res.send({ chef: data, results: results, avg: final })
                    });


            })


        } catch (error) {
            next(error);
        }
    })


//view all reviews of a chef
router.route("/viewallreviews")
    .post(async (req, res, next) => {
        try {
            //req.body={id:chefs id}
            await Review.find({ chef: req.body.id }).populate({ path: 'user', model: User }).then(async function (data) {
                res.send({ reviews: data })
            })

        } catch (error) {
            next(error);
        }

    })


//view your rating
router.route("/viewyourrating")
    .post(async (req, res, next) => {
        try {
            //req.body={id:chefs id}
            rate = 0
            await Rating.find({ chef: req.body.id, user: req.user._id }).then(async function (data) {
                if (data.length == 0) {
                    rate = 0
                }
                else {
                    rate = data[0].rating
                }
                res.send({ rating: rate })
            })

        } catch (error) {
            next(error);
        }

    })

//view your review
router.route("/viewyourreview")
    .post(async (req, res, next) => {
        try {
            //req.body={id:chefs id}
            review1 = ""
            await Review.find({ chef: req.body.id, user: req.user._id }).then(async function (data) {
                if (data.length == 0) {
                    review1 = ""
                }
                else {
                    review1 = data[0].review
                }
                res.send({ rev: review1 })
            })

        } catch (error) {
            next(error);
        }

    })


//Review Chef

router.route("/reviewchef")
    .post(async (req, res, next) => {
        try {
            // req.body={id:chef's id,review:user's entered review}
            //check if user has already reviewed the chef-update otherwise create new
            await Review.find({ user: req.user._id, chef: req.body.id }).then(async function (data) {
                if (data.length == 0) {
                    console.log('create new')
                    review1 = new Review({
                        chef: req.body.id,
                        user: req.user._id,
                        review: req.body.review
                    })

                    await review1.save()

                }
                else {
                    data[0].review = req.body.review;
                    await data[0].save()
                    console.log('update')
                }
            })
            res.send("review saved!")


        } catch (error) {
            next(error);
        }
    })


//---------------trial func-------------
router.route("/time")
    .get(async (req, res, next) => {
        try {

            ss = "07:15:10-10:15:10"
            console.log(ss.split('-'))

            time = '24:00:00'
            timec = tConvert(time)
            res.send(timec)

        } catch (error) {
            next(error);
        }

    })



module.exports = router;