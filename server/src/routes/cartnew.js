
const express = require('express');
const mongoose = require('mongoose');
const requireAuth = require('../middlewares/requireAuth');

const User = mongoose.model('User');
const router = express.Router();
router.use(requireAuth);

const models = require('../models/models')

Chef = models.chef;
Menu = models.menu;
OrderItem = models.orderItem;
Cart = models.cart;

//-----------------------calculating IST time---------------------
function getTime() {
    var currentTime = new Date();
    var currentOffset = currentTime.getTimezoneOffset();
    var ISTOffset = 330;   // IST offset UTC +5:30 
    var ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000);
    var hoursIST = ISTTime.getHours();
    var ampm = hoursIST >= 12 ? 'PM' : 'AM';
    hoursIST = hoursIST % 12;
    hoursIST = hoursIST ? hoursIST : 12;
    var minutesIST = ISTTime.getMinutes();
    minutesIST = minutesIST < 10 ? '0' + minutesIST : minutesIST;
    var time = hoursIST + ":" + minutesIST + " " + ampm;
    return time;
}
//-------------------------------------------------------------------

//add item to cart

router.route("/add")
    .post(async (req, res, next) => {
        try {
            //req.body:menuiteemid,quantity, chefid
            await req.body;
            var orderitem1;
            var flag = 0;
            var updateid;
            await Menu.findById(req.body.menuitemid).then(async function (data) {
                price1 = data.price * req.body.quantity
                await OrderItem.find({ userid: req.user.id, chef: req.body.chefid, isOrdered: false, menuItem: req.body.menuitemid }).then(async function (record) {
                    //if order item exists then update quantity otherwise add new
                    if (record.length == 0) {
                        orderitem1 = new OrderItem({
                            menuItem: req.body.menuitemid,
                            userid: req.user.id,
                            quantity: req.body.quantity,
                            timestamp: getTime(),
                            price: price1,
                            isOrdered: false
                        })

                        orderitem1.save()

                    }
                    else {
                        //update quantity

                        ord = record[record.length - 1]
                        ord.quantity = req.body.quantity
                        ord.price = price1
                        ord.timestamp = getTime()
                        ord.save()
                        updateid = ord.id;
                        flag = 1;
                    }

                })

                //add order item to cart
                //find if cart already exists otherwise create new
                await Cart.find({ userid: req.user.id, chef: req.body.chefid, isOrdered: false }).then(async function (result) {
                    // console.log(result)

                    if (result.length == 0) {
                        var cart1 = new Cart({
                            orderItems: [orderitem1],
                            userid: req.user.id,
                            chef: req.body.chefid,
                            isOrdered: false,
                            isDelivered: false
                        })

                        cart1.save()
                    }
                    else {
                        resultnew = result[result.length - 1]
                        console.log("cart(with the same chef) already exists")
                        if (flag == 0) {
                            resultnew.orderItems.push(orderitem1);
                            resultnew.save()

                        }
                        if (flag == 1) {
                            // console.log(resultnew.orderItems)
                            for (var i of resultnew.orderItems) {
                                if (i.id == updateid) {
                                    i.quantity = req.body.quantity
                                    i.price = price1
                                    i.timestamp = getTime()
                                    resultnew.save()

                                }
                            }

                        }

                    }

                })

                res.send(orderitem1);

            })




        } catch (error) {
            next(error);
        }
    });


//view cart
router.route("/view")
    .post(async (req, res, next) => {
        try {
            Cart.find({ userid: req.user.id, isOrdered: false }).populate({ path: 'chefid', model: Chef }).then(function (data) {
                res.send(data[0])
            })
        } catch (error) {
            next(error);
        }
    })