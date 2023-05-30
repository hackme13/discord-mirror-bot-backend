import axios from "axios"

export async function restartBot(req) {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'http://localhost:9000/action/startBot',
        headers: { 
            'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
        }
    };
    
    await axios.request(config);
    
    console.log(" ")
    console.log(`============  Bot restarted ============`)
    console.log(" ")
}