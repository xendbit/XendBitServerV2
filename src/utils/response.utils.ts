export class ResponseUtils {    
    static getSuccessResponse(data: any, message?: string): Response {
        const r: Response = {
            status: "success",
            message: message,
            data: data
        };

        return r;
    }
}

export class Response {
    status: string;
    message: string;
    data: any;
}