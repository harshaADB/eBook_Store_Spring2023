import {db} from './prisma.server'

export async function getAllMedia() {
	return db.media.findMany({
		orderBy: {
			title: 'asc',
		},
	})
}
