import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudIcon } from 'lucide-react';

export function WeatherWidget({ data }: { data: any }) {
  const { location, temperature, unit, condition, humidity, windSpeed } = data;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudIcon className="h-5 w-5" />
          Weather in {location}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold mb-2">
          {temperature}°{unit === 'celsius' ? 'C' : 'F'}
        </div>
        <div className="text-muted-foreground capitalize mb-4">{condition}</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Humidity: {humidity}%</div>
          <div>Wind: {windSpeed} km/h</div>
        </div>
      </CardContent>
    </Card>
  );
}
