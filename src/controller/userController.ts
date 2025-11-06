import {Request,Response} from 'express';
import {TicketService} from '../domain/services/ticketService.js';



const getUserInformation = async (req: Request, res: Response) => {

    try
    {
        const user = (req as any).user;

    }catch (error:any)
    {
        res.status(500).json({error: error.message});
    }

};