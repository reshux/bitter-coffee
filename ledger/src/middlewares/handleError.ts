import { NextFunction, Request, Response } from "express";
import { ErrorResponse } from "../types/response";
import { env } from "../env";

export const handleError = (
	err: Error,
	req: Request,
	res: Response<ErrorResponse>,
	_next: NextFunction,
) => {
	const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

	if (err.stack && env.NODE_ENV === "development") {
		console.error(err.stack);
	}

	res.status(statusCode).json({
		message: err.message,
	});
};
