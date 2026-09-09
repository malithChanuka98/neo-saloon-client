import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

export async function POST(request: NextRequest) { // Handle the POST request

   const body = await request.json(); // Parse the request body as JSON

   console.log(body); // Log the request body to the console

   if(body.email == null){

        return NextResponse.json(
            {
                message: "Email is required", // Return a JSON response indicating that the email is required
            },
            {
                status: 422, // Set the response status to 422 (Unprocessable Entity)
            }
        )
   }

   const user = await prisma.user.findFirst( // Find the first user in the database that matches the email provided in the request body
        {
            where: {
                email: body.email, // Find the first user with the matching email
            },
        }
   )

   console.log(user); // Log the found user to the console

   if(user == null){

        return NextResponse.json(
            {
                message: "User not found", // Return a JSON response indicating that the user was not found
            },
            {
                status: 404, // Set the response status to 404 (Not Found)
            }
        )
   }

   if(user.status != "ACTIVE"){

        return NextResponse.json(
            {
                message: "User is not active", // Return a JSON response indicating that the user is not active
            },
            {
                status: 403, // Set the response status to 403 (Forbidden)
            }
        )
   }

   const isPasswordValid = await compare(body.password, user.password); // Compare the provided password with the stored hashed password

   if(isPasswordValid){

        await prisma.user.update( // Update the user's last login time in the database
            {
                where: {
                    id: user.id, // Update the user with the matching ID
                },
                data: {
                    lastLogin: new Date(), // Update the last login time
                }
            }
        );

        const secretText = process.env.JOSE_SECRET; // Retrieve the secret text from environment variables

        const secret = new TextEncoder().encode(secretText); // Encode the secret text as a Uint8Array

        const token = await new jose.SignJWT({
            email: user.email, // Include the user's email in the JWT payload
            firstName: user.firstName, // Include the user's first name in the JWT payload
            lastName: user.lastName, // Include the user's last name in the JWT payload
            role: user.role, // Include the user's role in the JWT payload
            privileges: user.privileges, // Include the user's privileges in the JWT payload
        }).setProtectedHeader({ alg: "HS256" }).sign(secret) // Set the JWT header to use the HS256 algorithm

        const response = NextResponse.json(
            {
                message: "Login successful", // Return a JSON response indicating that the login was successful
                role: user.role, // Include the user's role in the response
            }
        )

        response.cookies.set(
            {
                name: "login-token", // Set the name of the cookie to "token"
                value: token, // Set the value of the cookie to the generated JWT
                httpOnly: true, // Set the cookie to be HTTP-only, preventing access from JavaScript
                secure: false, // Set the cookie to be secure, only sent over HTTPS
                sameSite: "lax",  // Set the cookie to be sent with same-site requests
                maxAge: 60 * 60 * 24 * 7, // Set the cookie to expire in 7 days
            }
        )

        return response; // Return the response with the cookie set
   }
   else{

        return NextResponse.json(
            {
                message: "Invalid password", // Return a JSON response indicating that the provided password is invalid
            },
            {
                status: 401, // Set the response status to 401 (Unauthorized)
            }
        )
   }
   

}