import {prisma} from "@repo/db/prisma"


export const func = () => {
  const user = prisma.user.findFirst({

  })
}



export default function Home() {
  return (
    <div className="flex">
      hello from home
    </div>
  );
}
