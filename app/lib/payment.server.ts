import type {User} from '@prisma/client'
import {db} from './prisma.server'

export function getPaymentsByUserId(userId: User['id']) {
	return db.payment.findMany({
		where: {
			userId,
		},
	})
}
