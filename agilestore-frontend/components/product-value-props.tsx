import type { LucideIcon } from "lucide-react"
import * as Icons from "lucide-react"

interface ValueProp {
  icon: string
  title: string
  description: string
}

interface ProductValuePropsProps {
  valueProps: ValueProp[]
}

export function ProductValueProps({ valueProps }: ProductValuePropsProps) {
  return (
    <section className="bg-gray-50 py-16 sm:py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {valueProps.map((prop, index) => {
            const IconComponent = Icons[prop.icon as keyof typeof Icons] as LucideIcon

            return (
              <div key={index} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-blue-500">
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{prop.title}</h3>
                <p className="mt-2 text-gray-600">{prop.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
