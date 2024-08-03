const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); // Add axios for making HTTP requests
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const app = express();
const port = process.env.PORT || 3000;

// Hard-coded Agora App ID and App Certificate
const appId = 'db5971c7ec8a45fb895ae1cc3ad3cf4b'; // Replace with your Agora App ID
const appCertificate = 'b811e0a60bd04e48b01fbb4bf5d63ca9'; // Replace with your Agora App Certificate


// Token expiration time in seconds
const tokenExpirationInSecond = 3600;

app.use(bodyParser.json());


// New endpoint to kick a user from a channel
app.post('/kick_user', async (req, res) => {
    const { channelName, uid } = req.body;

    if (!channelName || !uid) {
        return res.status(400).send('Missing parameters');
    }

    try {
        const response = await axios.post(
            'https://api.agora.io/dev/v1/kicking-rule',
            {
                appId: appId,
                appCertificate: appCertificate,
                channelName: channelName,
                uid: uid
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${Buffer.from(`${appId}:${appCertificate}`).toString('base64')}`
                }
            }
        );

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error kicking user:', error);
        res.status(500).send('Error kicking user');
    }
});


// Endpoint to fetch or renew RTC token
app.post('/fetch_rtc_token', (req, res) => {
    const { uid, channelName, role } = req.body;

    if (!uid || !channelName || !role) {
        return res.status(400).send('Missing parameters');
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + tokenExpirationInSecond;

    let roleType;
    if (role === 'broadcaster') {
        roleType = RtcRole.PUBLISHER;
    } else if (role === 'audience') {
        roleType = RtcRole.SUBSCRIBER;
    } else {
        return res.status(400).send('Invalid role');
    }

    // Generate Token
    const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        roleType,
        privilegeExpiredTs
    );

    console.log(`Generated Token: ${token}`); // Log token for debugging

    res.json({ token }); // Send token in response
});

// Start the server
app.listen(port, () => {
    console.log(`Token server listening at http://localhost:${port}`);
});
