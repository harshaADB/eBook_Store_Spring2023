import {Role} from '@prisma/client'
import type {LoaderArgs, SerializeFrom} from '@remix-run/node'
import {json, redirect} from '@remix-run/node'
import {Outlet} from '@remix-run/react'
import {requireUser} from '~/lib/session.server'
import {getAllNotAdminUsers} from '~/lib/user.server'

export type AdminLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	const user = await requireUser(request)

	if (user.role !== Role.ADMIN) {
		return redirect('/')
	}

	const nonAdminUsers = await getAllNotAdminUsers()

	return json({
		nonAdminUsers,
	})
}

export default function AdminLayout() {
	return <Outlet />
}
