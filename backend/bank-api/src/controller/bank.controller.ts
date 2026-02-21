import type { Request, Response } from "express";
import crypto from "node:crypto";
import axios from "axios";

export const createOrder = (req: Request, res: Response) => {
    const {ref, amount } = req.body;
}