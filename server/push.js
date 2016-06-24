"use strict";

const webPush = require("web-push");

const gcmApiKey = process.env.GCM_API_KEY || require("./gcmApiKey");

if(!gcmApiKey) {
    throw new Error("You have to provide an GCM_API_KEY");
}

webPush.setGCMAPIKey(gcmApiKey);

module.exports = function sendPush(subscription, payload) {
    return webPush.sendNotification(subscription.endpoint, {
        userPublicKey: subscription.key,
        userAuth: subscription.auth,
        payload: JSON.stringify(payload)
    });
};