import type {LoaderArgs} from '@remix-run/node'
import {redirect} from '@remix-run/node'
import {Outlet} from '@remix-run/react'
import {getUser} from '~/lib/session.server'

export const loader = async ({request}: LoaderArgs) => {
	const user = await getUser(request)
	if (user) return redirect('/')
	return null
}

export default function AuthLayout() {
	return (
		<>
			<div className="flex min-h-full">
				<div className="mx-auto flex flex-col justify-start sm:justify-center sm:mt-6">
					<div className="w-full max-w-sm lg:w-96 sm:border sm:shadow-md sm:border-gray-300 bg-white sm:rounded-md p-4 sm:px-6 sm:py-10">
						<Outlet />
					</div>
				</div>
			</div>
		</>
	)
}
