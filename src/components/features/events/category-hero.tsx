// Category Hero Component
export interface CategoryHeroProps {
  category: {
    name: string;
    description: string;
    icon?: string;
    banner_url?: string | null;
  };
}

export function CategoryHero({ category }: CategoryHeroProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4">
          {category.icon && (
            <span className="text-4xl" role="img" aria-label="category icon">
              {category.icon}
            </span>
          )}
          <div>
            <h1 className="text-4xl font-bold">{category.name}</h1>
            <p className="text-lg mt-2 opacity-90">{category.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
