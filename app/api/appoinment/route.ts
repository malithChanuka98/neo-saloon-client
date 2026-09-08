import { getUser } from "@/utils/authentication";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) { 

    const user = getUser(request); // Call the getUser function to retrieve the user information from the request

    console.log("User: ", user); // Log the retrieved user information to the console
}