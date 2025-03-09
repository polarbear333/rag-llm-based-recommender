// components/ProductDescription.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ProductDescriptionProps {
  description: string;
  details?: string[];
  className?: string;
}

export const ProductDescription = ({ 
  description, 
  details,
  className 
}: ProductDescriptionProps) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={className}>
      {/* Main description paragraph */}
      <p className="leading-snug text-base text-gray-800 font-medium mb-4">{description}</p>
      
      {/* Technical details expandable section */}
      {details && details.length > 0 && (
        <div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Technical Details' : 'View Technical Details'}
          </Button>
          
          {showDetails && (
            <ul className="list-disc pl-5 space-y-2 mt-4 text-base text-gray-800 font-medium">
              {details.map((bullet, index) => (
                <li key={index}>{bullet}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};