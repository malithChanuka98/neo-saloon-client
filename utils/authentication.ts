import { NextRequest } from "next/server";
import * as jose from "jose";
import { RequestUserType } from "@/types/requestUser";

export async function getUser(request: NextRequest) : Promise<RequestUserType | null> {
    
    const loginToken = request.cookies.get("login-token")?.value // Retrieve the login token from the request cookies

    const secretText = process.env.JOSE_SECRET; // Retrieve the secret text from environment variables

    const secret = new TextEncoder().encode(secretText); // Encode the secret text as a Uint8Array

    try {

        const tokenData = await jose.jwtVerify(

            loginToken||"",  
            secret
            
        ) // Verify the JWT using the secret

        const user = tokenData.payload as unknown as RequestUserType; // Cast the payload of the verified JWT to the RequestUserType interface

        return user; // Return the verified user information
    }
    catch {

        return null; // If verification fails, return null indicating that the user is not authenticated

    }

}

export async function isPrivileged(request: NextRequest, privilege: string) : Promise<boolean> {

    const user : RequestUserType | null = await getUser(request); // Retrieve the authenticated user from the request

    if (user == null) {

        return false; // If the user is not authenticated, they are not privileged

    }

    if (user.privileges.includes(privilege)) {

        return true; // If the user has the required privilege, they are privileged

    }else {
  
        return false; // If the user does not have the required privilege, they are not privileged

    }
}