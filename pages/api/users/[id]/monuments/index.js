
import {addMonumentToFavourites} from "@/controllers/user";

export default async function handler (req, res) {
    const { method } = req
    if (method === 'GET') {
        //await fillDb();
        res.json({message:"hi"})
    } else if (method === 'POST') {
        return addMonumentToFavourites(req, res)
    }
}