import { NextRequest } from "next/server";
import * as jose from "jose";

export async function GET(request: NextRequest) {

    const loginToken = request.cookies.get("login-token")?.value; // Retrieve the value of the "login-token" cookie from the request
    
    const secretText = process.env.JOSE_SECRET; // Retrieve the secret text from environment variables

    const secret = new TextEncoder().encode(secretText); // Encode the secret text as a Uint8Array
    
    const user = await jose.jwtVerify(

        loginToken||"", 
        secret
        
    ) // Verify the JWT using the secret

    console.log("User: ", user); // Log the verified user information to the console
    
    console.log("GET request received at /api/products"); // Log a message indicating that a GET request was received at the /api/products endpoint

}