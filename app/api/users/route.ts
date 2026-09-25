import prisma from "@/lib/prisma";
import { getUser, isPrivileged } from "@/utils/authentication";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request : NextRequest){

    const havePrivilege = await isPrivileged(request, "users:read") // check if the user has the privilege to read users

    if(!havePrivilege){ // if the user does not have the privilege to read users, return a 403 response
        return NextResponse.json(
            {
                message : "You do not have the privilege to view users"
            },
            {
                status : 403
            }
        )
    }

    const pageNumberInString = request.nextUrl.searchParams.get("pageNumber") || "1" // get the page number from the query params, default to 1 if not provided

    const pageSizeInString = request.nextUrl.searchParams.get("pageSize") || "10" // get the page size from the query params, default to 10 if not provided

    const pageNumber = parseInt(pageNumberInString) // convert the page number to an integer
    const pageSize = parseInt(pageSizeInString) // convert the page size to an integer

    const userCount = await prisma.user.count() // get the total number of users in the database

    const totalPages = Math.ceil(userCount / pageSize) // calculate the total number of pages based on the user count and page size

    if(pageNumber > totalPages){ // if the requested page number is greater than the total number of pages, return a 404 response
        return NextResponse.json(
            {
                message : "Page not found",
                totalPages : totalPages
            },
            {
                status : 404
            }
        )
    }

    const users = await prisma.user.findMany({
        skip : (pageNumber - 1) * pageSize, // skip the users from the previous pages
        take : pageSize, // take the number of users for the current page
        select: {   
            id :true,
            email :true,
            phone :true,    
            firstName :true,
            lastName :true,
            password : false,
            role :true, 
            status :true,
            createdAt : true,
            lastLogin : true,
            privileges : true
        }
    })

   

    return NextResponse.json(
        {
            message : "Users fetched successfully",
            users : users,
            pagination : {
                pageNumber : pageNumber,
                pageSize : pageSize,
                totalPages : totalPages,
                totalUsers : userCount
            }
        }
    )
}

export async function POST(request : NextRequest){

    //email , firstName, lastName, password, phone(optional)

    const body = await request.json()

    if(body.email == null){
        return NextResponse.json(
            {
                message : "Email is required"
            },
            {
                status : 422
            }
        )
    }

    if(body.firstName == null){
        return NextResponse.json(
            {
                message : "First name is required"
            },
            {
                status : 422
            }
        )
    }

    if(body.lastName == null){
        return NextResponse.json(
            {
                message : "Last name is required"
            },
            {
                status : 422
            }
        )
    }

    if(body.password == null){
        return NextResponse.json(
            {
                message : "Password is required"
            },
            {
                status : 422
            }
        )
    }

    const existingUser = await prisma.user.findUnique(
        {
            where : {
                email : body.email
            }
        }
    )

    if(existingUser != null){
        return NextResponse.json(
            {
                message : "User with this email already exists"
            },
            {
                status : 409
            }
        )
    }

    const passwordHash = await bcrypt.hash(body.password, 12)

    await prisma.user.create({
        data :{
            email : body.email,
            firstName : body.firstName,
            lastName : body.lastName,
            password : passwordHash,
            phone : body.phone,
        }
    })

    return NextResponse.json(
        {
            message : "User created successfully"
        },
        {
            status : 201
        }
    )

}

export async function PUT(request : NextRequest){

    const id = request.nextUrl.searchParams.get("id")

    const requestedUser = await getUser(request)

    if(requestedUser == null){
        return NextResponse.json(
            {
                message : "You are not logged in"
            },
            {
                status : 401
            }
        )
    }

    const body = await request.json()

    if(requestedUser.id == id){// never allow user to updarte their own account, they should contact admin to do that   

        const user = await prisma.user.findUnique({
            where : {
                id : id
            }
        })

        if(user == null){
            return NextResponse.json(
                {
                    message : "User not found"
                },
                {
                    status : 404
                }
            )
        }

        await prisma.user.update({
            where : {
                id : id
            },
            data : {
                email : body.email || user.email,
                firstName : body.firstName || user.firstName,
                lastName : body.lastName || user.lastName,
                phone : body.phone || user.phone,
                profileImage : body.profileImage || user.profileImage
            }
        })

        return NextResponse.json(
            {
                message : "User updated successfully"
            }
        )

    }else{
        // user is trying to update someone else's account, check if they have the privilege
        const havePrivilege = await isPrivileged(request, "users:edit")

        if(!havePrivilege){
            return NextResponse.json(
                {
                    message : "You do not have the privilege to edit users"
                },
                {
                    status : 403
                }
            )
        }

        const user = await prisma.user.findUnique({
            where : {
                id : id||"000000"

            }
        })

        if(user == null){
            return NextResponse.json(
                {
                    message : "User not found"
                },
                {
                    status : 404
                }
            )
        }
        
        await prisma.user.update({
            where : {
                id : id||"000000"   
            },
            data : {
                email : body.email || user.email,   
                firstName : body.firstName || user.firstName,
                lastName : body.lastName || user.lastName,
                phone : body.phone || user.phone,
                profileImage : body.profileImage || user.profileImage,
                role : body.role || user.role,
                status : body.status || user.status,
                privileges : body.privileges || user.privileges
            }
        })

        return NextResponse.json(
            {
                message : "User updated successfully"
            }
        )

    }
    
}