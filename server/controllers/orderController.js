import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "stripe";
import User from "../models/User.js";


//Place Order COD
export const placeOrderCOD = async (req, res) => {
    try {
        const { userId, items, address } = req.body;

        // Validate
        if (!address || !items || items.length === 0) {
            return res.json({ success: false, message: "Invalid data" });
        }

        let amount = 0;

        for (const item of items) {
            if (!item.product) {
                return res.json({ success: false, message: "Product ID is missing in one of the items." });
            }

            if (typeof item.quantity !== 'number' || isNaN(item.quantity)) {
                return res.json({ success: false, message: `Invalid quantity for product ${item.product}` });
            }

            const product = await Product.findById(item.product);
            if (!product) {
                return res.json({ success: false, message: `Product not found: ${item.product}` });
            }

            amount += product.offerPrice * item.quantity;
        }

        // Add tax
        amount += Math.floor(amount * 0.02);

        // Save order
        await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "COD",
        });

        return res.json({ success: true, message: "Order Placed Successfully" });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}


//Place Order STRIPE
export const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, address } = req.body;

        const { origin } = req.headers;

        // Validate
        if (!address || !items || items.length === 0) {
            return res.json({ success: false, message: "Invalid data" });
        }

        let amount = 0;

        let productData = [];

        for (const item of items) {
            if (!item.product) {
                return res.json({ success: false, message: "Product ID is missing in one of the items." });
            }

            if (typeof item.quantity !== 'number' || isNaN(item.quantity)) {
                return res.json({ success: false, message: `Invalid quantity for product ${item.product}` });
            }

            const product = await Product.findById(item.product); // 🟢 Now product is defined

            if (!product) {
                return res.json({ success: false, message: `Product not found: ${item.product}` });
            }

            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity,
            });

            amount += product.offerPrice * item.quantity;
        }


        // Add tax
        amount += Math.floor(amount * 0.02);

        // Save order
        const order = await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "Online",
        });

        //stripe gateway initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        //create line item for stripe
        const line_items = productData.map((item) => {
            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: Math.floor(item.price + item.price * 0.02) * 100
                },
                quantity: item.quantity,
            }
        })

        //create session
        const session = await stripeInstance.checkout.sessions.create({
            line_items,
            mode: "payment",
            success_url: `${origin}/loader?next=my-orders`,
            cancel_url: `${origin}/cart`,
            metadata: {
                orderId: order._id.toString(),
                userId,
            }
        })

        return res.json({ success: true, url: session.url });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

//stripe webhooks to verify payment action
export const stripeWebhook = async (request, response) => {
    //stripe gateway initialize 
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    const sig = request.headers["stripe-signature"];
    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            request.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        response.status(400).send(`Webhook Error: ${error.message}`);
    }

    //handle event
    switch (event.type) {
        case "payment_intent.succeeded": {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            //getting session metadata
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });

            const { orderId, userId } = session.data[0].metadata;

            //mark payment as paid
            await Order.findByIdAndUpdate(orderId, {isPaid: true});

            //clear user cart
            await User.findByIdAndUpdate(userId, {cartItems: {}});
            break;
        }

        case "payment_intent.payment_failed": {
             const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            //getting session metadata
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });

            const { orderId } = session.data[0].metadata;

            await Order.findByIdAndDelete(orderId);
            break;
        }
            

        default:
            console.error(`Unhandled event type ${event.type}`);
            break;
    }
    response.json({received: true});
}


//Get order by user id
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.find({
            userId,
            $or: [{ paymentType: "COD" }, { isPaid: true }]
        }).populate("items.product address").sort({ createdAt: -1 });

        res.json({ success: true, orders });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};


//Get all orders for seller / admin
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [{ paymentType: "COD" }, { isPaid: true }]
        }).populate("items.product address").sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}