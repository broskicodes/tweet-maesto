import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Planner() {
  return (
    <div className="flex-1 p-6">
      <div className="grid grid-cols-2 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Account Goals</CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: Add goal tracking metrics, growth targets */}
            <p className="text-gray-600">Set and track your social media goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Topics</CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: Add topic management, categories */}
            <p className="text-gray-600">Organize and plan your content themes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inspiration</CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: Add trending topics, content ideas */}
            <p className="text-gray-600">Discover trending topics and content ideas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
