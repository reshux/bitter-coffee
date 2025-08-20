import type { NextFunction, Request, Response } from "express";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
	res.status(404);
	const error = new Error(`Requested URL not found. URL: - ${req.originalUrl}`);
	next(error);
};
