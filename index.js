const axios = require('axios');
const cheerio = require('cheerio');
const twilio = require('twilio');
const acctSid = '';
const authToken = '';
const client = new twilio(acctSid, authToken);
const twilioNumber = '';
const baseURL = '';
const barbellEndpoints = [
    {
        url: '',
        price: 295,
        displayName: ''
    },
    {
        url: '',
        price: 285,
        displayName: ''
    },
    {
        url: '',
        price: 285,
        displayName: ''
    },
    {
        url: '',
        price: 265,
        displayName: ''
    }
];

// IIFE to use top level await
(async () => {
    let targetAcquired = false;
    let attemptNum = 0;

    function sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
    }

    // helper fn to see if an 'Add to cart' class exists
    const isProductAvailable = (html) => html('.add-to-cart').text().trim() === 'Add to Cart';

   function fetchHtml(url){
        // fetch data from a url endpoint
        return axios.get(url);
    }

    async function sendText({ body }){
        await client.messages.create({
            body,
            to: '',
            from: twilioNumber
        })
    }

    while(!targetAcquired) {
        attemptNum++;
        console.log(`\n num: ${attemptNum}`);
        const promises = barbellEndpoints.map((endpoint) => {
            return fetchHtml(`${baseURL}/${endpoint.url}`).then((res)=>{
                return {
                    'name': endpoint.displayName,
                    'available': isProductAvailable(cheerio.load(res.data)),
                    'url': `${baseURL}/${endpoint.url}`
                };
            });
        });

        const results = await Promise.all(promises);
        const parsedResults = JSON.parse(JSON.stringify(results));
        console.log('results: ', parsedResults);
        const barbellFound = parsedResults.find(obj => obj.available);
        console.log('barbell found: ', !!barbellFound);
        if (!!barbellFound) {
            console.log(`\n${barbellFound.name} is available!`)
            console.log('Sending text...');
            await sendText({
                body: `${barbellFound.name} is available.\n Go to ${barbellFound.url} to purchase!`
            });
            targetAcquired = true;
        }
        await sleep(5000); // take a snooze for a couple seconds between tries
    }
})();