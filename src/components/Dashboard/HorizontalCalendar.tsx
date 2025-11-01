// In Datei: src/components/Dashboard/HorizontalCalendar.tsx
// VOLLSTÄNDIGER CODE

import { Box, Flex, Text, VStack, IconButton, Icon } from '@chakra-ui/react';
import { IoMoonOutline, IoMoon } from 'react-icons/io5';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { 
  startOfWeek, addDays, format, isSameDay, 
  isToday, subDays 
} from 'date-fns';
import { de } from 'date-fns/locale';
import { useMemo, useState, useEffect } from 'react';
import SunCalc from 'suncalc'; // Dieser Import funktioniert jetzt

interface HorizontalCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

// Helferfunktion für Mondphase
function getMondphase(datum: Date): { name: string; icon: any; transform?: string } {
  const illumination = SunCalc.getMoonIllumination(datum);
  const phase = illumination.phase; 

  if (phase <= 0.03 || phase >= 0.97) {
    return { name: "Neumond", icon: IoMoonOutline };
  }
  if (phase > 0.03 && phase < 0.22) {
    return { name: "Zunehmende Sichel", icon: IoMoonOutline, transform: "rotate(45deg)" };
  }
  if (phase >= 0.22 && phase <= 0.28) {
    return { name: "Erstes Viertel", icon: IoMoon, transform: "translateX(50%) scaleX(0.5)" };
  }
  if (phase > 0.28 && phase < 0.47) {
    return { name: "Zunehmender Mond", icon: IoMoon, transform: "translateX(25%) scaleX(0.75)" };
  }
  if (phase >= 0.47 && phase <= 0.53) {
    return { name: "Vollmond", icon: IoMoon };
  }
  if (phase > 0.53 && phase < 0.72) {
    return { name: "Abnehmender Mond", icon: IoMoon, transform: "translateX(-25%) scaleX(0.75)" };
  }
  if (phase >= 0.72 && phase <= 0.78) {
    return { name: "Letztes Viertel", icon: IoMoon, transform: "translateX(-50%) scaleX(0.5)" };
  }
  return { name: "Abnehmende Sichel", icon: IoMoonOutline, transform: "rotate(-45deg)" };
}


export function HorizontalCalendar({ selectedDate, onDateSelect }: HorizontalCalendarProps) {

  const [displayDate, setDisplayDate] = useState(selectedDate);

  useEffect(() => {
    setDisplayDate(selectedDate);
  }, [selectedDate]);

  const weekDays = useMemo(() => {
    const wocheStart = startOfWeek(displayDate, { locale: de }); 
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(wocheStart, i));
    }
    return days;
  }, [displayDate]);

  const monatName = format(displayDate, 'LLLL yyyy', { locale: de }).toUpperCase();
  const mondPhase = getMondphase(displayDate);

  const handlePrevWeek = () => {
    setDisplayDate(prev => subDays(prev, 7));
  };
  const handleNextWeek = () => {
    setDisplayDate(prev => addDays(prev, 7));
  };
  
  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb={4}>
        <IconButton
          icon={<FiChevronLeft />}
          aria-label="Vorherige Woche"
          onClick={handlePrevWeek}
          variant="ghost"
        />
        <VStack spacing={0}>
          <Text fontWeight="bold" fontSize="lg">{monatName}</Text>
          <Flex align="center" gap={2} color="gray.400">
            <Icon 
              as={mondPhase.icon} 
              size="0.8em" 
              transform={mondPhase.transform || 'none'}
            />
            <Text fontSize="xs">{mondPhase.name.toUpperCase()}</Text>
          </Flex>
        </VStack>
        <IconButton
          icon={<FiChevronRight />}
          aria-label="Nächste Woche"
          onClick={handleNextWeek}
          variant="ghost"
        />
      </Flex>
      
      <Flex justify="space-between">
        {weekDays.map((tag) => {
          const isTagHeute = isToday(tag);
          const isTagAusgewaehlt = isSameDay(tag, selectedDate); 

          let bgColor = 'transparent';
          let textColor = 'whiteAlpha.900';
          
          if (isTagAusgewaehlt) {
            bgColor = 'green.500';
            textColor = 'white';
          } else if (isTagHeute) {
            bgColor = 'yellow.500';
            textColor = 'gray.900';
          }

          return (
            <VStack
              key={tag.toString()}
              as="button"
              onClick={() => onDateSelect(tag)}
              bg={bgColor}
              color={textColor}
              borderRadius="lg"
              p={3}
              spacing={1}
              minW="40px"
              _hover={{ bg: isTagAusgewaehlt ? 'green.600' : 'gray.700' }}
            >
              <Text fontSize="xs" fontWeight="medium" color={isTagAusgewaehlt ? 'white' : (isTagHeute ? 'gray.900' : 'gray.400')}>
                {format(tag, 'E', { locale: de })}
              </Text>
              <Text fontWeight="bold">
                {format(tag, 'd')}
              </Text>
            </VStack>
          );
        })}
      </Flex>
    </Box>
  );
}