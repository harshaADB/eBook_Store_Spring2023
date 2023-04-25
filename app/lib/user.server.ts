import type {User} from '@prisma/client'
import {Role} from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import {db} from '~/lib/prisma.server'
import {createPasswordHash} from '~/utils/misc'

export async function getUserById(id: User['id']) {
	return db.user.findUnique({
		where: {id},
	})
}

export async function getUserByEmail(email: User['email']) {
	return db.user.findUnique({
		where: {email},
		select: {
			name: true,
			email: true,
		},
	})
}

export async function createUser({
	email,
	password,
	name,
}: {
	email: User['email']
	password: string
	name: User['name']
}) {
	return db.user.create({
		data: {
			name,
			email,
			passwordHash: await createPasswordHash(password),
		},
	})
}

export async function verifyLogin(email: User['email'], password: string) {
	const userWithPassword = await db.user.findUnique({
		where: {email},
	})

	if (!userWithPassword || !userWithPassword.passwordHash) {
		return null
	}

	const isValid = await bcrypt.compare(password, userWithPassword.passwordHash)

	if (!isValid) {
		return null
	}

	const {passwordHash: _password, ...userWithoutPassword} = userWithPassword

	return userWithoutPassword
}

export function getAllNotAdminUsers() {
	return db.user.findMany({
		where: {
			role: {
				not: Role.ADMIN,
			},
		},
		include: {
			transactions: {
				include: {
					media: true,
				},
			},
		},
	})
}
