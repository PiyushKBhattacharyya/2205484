import { Card, CardContent } from "@/components/ui/card";

interface DataCardProps {
  title: string;
  value: number | string;
  isLoading?: boolean;
}

export function DataCard({ title, value, isLoading = false }: DataCardProps) {
  return (
    <Card className="bg-white rounded-lg shadow-sm">
      <CardContent className="p-4">
        <p className="text-sm text-gray-500">{title}</p>
        {isLoading ? (
          <div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
        ) : (
          <p className="text-xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
