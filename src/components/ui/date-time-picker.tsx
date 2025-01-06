'use client';

import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Button } from './button';
import { Calendar as CalendarIcon, Clock, Timer } from 'lucide-react';
import { Switch } from './switch';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from './calendar';

interface DateTimePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  const [selectedHour, setSelectedHour] = React.useState('12');
  const [selectedMinute, setSelectedMinute] = React.useState('00');
  const [preciseTime, setPreciseTime] = React.useState(false);

  const hours = React.useMemo(() =>
    Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')),
    []
  );

  const minutes = React.useMemo(() =>
    Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')),
    []
  );

  const handleTimeChange = (hour: string, minute: string) => {
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
      setDate(newDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <Timer className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP HH:mm') : <span>Pick a date and time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => {
            if (newDate) {
              const newDateWithTime = new Date(newDate);
              newDateWithTime.setHours(
                parseInt(selectedHour),
                parseInt(selectedMinute),
                0,
                0
              );
              setDate(newDateWithTime);
            } else {
              setDate(undefined);
            }
          }}
          initialFocus
        />
        <div className="p-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="w-full flex justify-center gap-2">  {/* Added container */}
              {preciseTime ? (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={selectedHour}
                    onValueChange={(hour) => {
                      setSelectedHour(hour);
                      handleTimeChange(hour, selectedMinute);
                    }}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-muted-foreground">:</span>

                  <Select
                    value={selectedMinute}
                    onValueChange={(minute) => {
                      setSelectedMinute(minute);
                      handleTimeChange(selectedHour, minute);
                    }}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                      {minutes.map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Select
                  value={`${selectedHour}:00`}
                  onValueChange={(time) => {
                    const [hour] = time.split(':');
                    setSelectedHour(hour);
                    setSelectedMinute('00');
                    handleTimeChange(hour, '00');
                  }}
                >
                  <SelectTrigger
                    className='w-36'
                  >
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((hour) => (
                      <SelectItem key={hour} value={`${hour}:00`}>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          {hour}:00
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Switch checked={preciseTime} onCheckedChange={setPreciseTime} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}