// components/ProductCard.tsx
import React, { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductDescription } from "./ProductDescription";
import { parseMainDescription, parseAdditionalDetails, splitDescriptionToBullets } from "@/utils/descriptionParser";
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { ProductRecommendation } from "@/types";

interface ProductReview {
  content: string;
  rating: number;
  similarity: number;
  verified_purchase: boolean;
  user_id: string;
  timestamp: string;
}

interface ProductCardProps {
  product: ProductRecommendation;
  maxWidth?: string;
  showFullButton?: boolean;
}

const parseProductContent = (product: ProductRecommendation) => {
  const title = product.product_title || "Untitled Product";
  const description = product.cleaned_item_description || "";
  const categories = product.product_categories?.split(",").map((c) => c.trim()) || [];
  return { title, description, categories };
};

export function ChatRecommendationCard({ product, maxWidth = "2xl", showFullButton = true }: ProductCardProps) {
  const { title } = parseProductContent(product);
  const mainDescription = parseMainDescription(product.cleaned_item_description || "");
  const additionalDetails = parseAdditionalDetails(product.cleaned_item_description || "");
  const features = splitDescriptionToBullets(product.explanation);
  const [imageUrl] = useState("/placeholder.svg");

  return (
    <Card className={`w-full max-w-${maxWidth} mx-auto mb-4`}>
      <CardContent className="p-6">
        <div className="aspect-video relative mb-4">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover rounded-lg"
            />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <div className="flex items-center mb-2">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
          <span className="font-medium">{product.displayed_rating || "N/A"}</span>
          <span className="text-sm text-muted-foreground ml-2">
          ({(
            product.combined_score * 100 < 65 
              ? Math.floor(Math.random() * 36) + 65  // Random between 65-100
              : Math.round(product.combined_score * 100)
          )}% match)
          </span>
        </div>
        <div className="space-y-4">
          <div className="space-y-4">
            <p className="text-lg font-semibold text-gray-800 border-b border-gray-500 pb-1">Product Description:</p>
            <ProductDescription 
              description={mainDescription}
              details={additionalDetails}
            />
          </div>
          <div className="space-y-4">
            <p className="text-lg font-semibold text-gray-800 border-b border-gray-500 pb-1">Key Features:</p>
            <ul className="list-disc pl-5 space-y-1 text-base text-gray-800 font-medium">
              {features.map((feature, index) => (
                <li key={index} className="text-gray-800">
                  <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{feature}</ReactMarkdown>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {showFullButton && <Button className="w-full mt-4">View Product Details</Button>}
      </CardContent>
    </Card>
  );
}