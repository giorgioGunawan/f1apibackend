import fetch from 'node-fetch';

// Function to convert UTC time to Unix timestamp
function convertToTimestamp(dateStr, timeStr) {
  if (timeStr === "N/A") return null;
  
  // Parse the date (Mar 16, 2025 format)
  const months = {"Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, 
                  "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11};
  
  const [month, day] = dateStr.split(" ");
  const date = new Date(2025, months[month], parseInt(day));
  
  // Parse the time (HH:MM format)
  const [hours, minutes] = timeStr.split(":").map(num => parseInt(num));
  
  // Set the time
  date.setUTCHours(hours, minutes, 0, 0);
  
  // Return Unix timestamp (seconds since epoch)
  return Math.floor(date.getTime() / 1000);
}

// Race data for the 2025 F1 season
const races = [
  {
    "round": "1",
    "name": "Australian Grand Prix",
    "location": "Albert Park Circuit, Melbourne",
    "datetime_fp1": convertToTimestamp("Mar 16", "01:30"),
    "datetime_fp2": convertToTimestamp("Mar 16", "05:30"),
    "datetime_fp3": convertToTimestamp("Mar 16", "01:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("Mar 16", "05:30"),
    "datetime_race": convertToTimestamp("Mar 16", "05:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "2",
    "name": "Chinese Grand Prix",
    "location": "Shanghai International Circuit, Shanghai",
    "datetime_fp1": convertToTimestamp("Mar 23", "03:30"),
    "datetime_fp2": null,
    "datetime_fp3": null,
    "datetime_sprint": convertToTimestamp("Mar 23", "07:00"),
    "datetime_qualifying": convertToTimestamp("Mar 23", "07:30"),
    "datetime_race": convertToTimestamp("Mar 23", "07:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "3",
    "name": "Japanese Grand Prix",
    "location": "Suzuka International Racing Course",
    "datetime_fp1": convertToTimestamp("Apr 6", "02:30"),
    "datetime_fp2": convertToTimestamp("Apr 6", "06:30"),
    "datetime_fp3": convertToTimestamp("Apr 6", "02:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("Apr 6", "06:30"),
    "datetime_race": convertToTimestamp("Apr 6", "06:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "4",
    "name": "Bahrain Grand Prix",
    "location": "Bahrain International Circuit, Sakhir",
    "datetime_fp1": convertToTimestamp("Apr 13", "11:30"),
    "datetime_fp2": convertToTimestamp("Apr 13", "15:30"),
    "datetime_fp3": convertToTimestamp("Apr 13", "12:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("Apr 13", "16:30"),
    "datetime_race": convertToTimestamp("Apr 13", "15:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "5",
    "name": "Saudi Arabian Grand Prix",
    "location": "Jeddah Corniche Circuit, Jeddah",
    "datetime_fp1": convertToTimestamp("Apr 20", "12:30"),
    "datetime_fp2": convertToTimestamp("Apr 20", "16:30"),
    "datetime_fp3": convertToTimestamp("Apr 20", "13:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("Apr 20", "17:30"),
    "datetime_race": convertToTimestamp("Apr 20", "17:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "6",
    "name": "Miami Grand Prix",
    "location": "Miami International Autodrome, Miami",
    "datetime_fp1": convertToTimestamp("May 4", "17:30"),
    "datetime_fp2": null,
    "datetime_fp3": null,
    "datetime_sprint": convertToTimestamp("May 3", "21:00"),
    "datetime_qualifying": convertToTimestamp("May 3", "01:00"),
    "datetime_race": convertToTimestamp("May 4", "01:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "7",
    "name": "Emilia Romagna Grand Prix",
    "location": "Imola Circuit, Imola",
    "datetime_fp1": convertToTimestamp("May 18", "10:30"),
    "datetime_fp2": convertToTimestamp("May 18", "14:30"),
    "datetime_fp3": convertToTimestamp("May 18", "10:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("May 18", "14:30"),
    "datetime_race": convertToTimestamp("May 18", "13:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "8",
    "name": "Monaco Grand Prix",
    "location": "Circuit de Monaco, Monte Carlo",
    "datetime_fp1": convertToTimestamp("May 25", "10:30"),
    "datetime_fp2": convertToTimestamp("May 25", "14:30"),
    "datetime_fp3": convertToTimestamp("May 25", "10:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("May 25", "14:30"),
    "datetime_race": convertToTimestamp("May 25", "13:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "9",
    "name": "Spanish Grand Prix",
    "location": "Circuit de Barcelona-Catalunya, Montmeló",
    "datetime_fp1": convertToTimestamp("Jun 1", "10:30"),
    "datetime_fp2": convertToTimestamp("Jun 1", "14:30"),
    "datetime_fp3": convertToTimestamp("Jun 1", "10:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("Jun 1", "14:30"),
    "datetime_race": convertToTimestamp("Jun 1", "13:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "10",
    "name": "Canadian Grand Prix",
    "location": "Circuit Gilles Villeneuve, Montreal",
    "datetime_fp1": convertToTimestamp("Jun 15", "16:30"),
    "datetime_fp2": convertToTimestamp("Jun 15", "20:30"),
    "datetime_fp3": convertToTimestamp("Jun 15", "16:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("Jun 15", "20:30"),
    "datetime_race": convertToTimestamp("Jun 15", "19:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "11",
    "name": "Austrian Grand Prix",
    "location": "Red Bull Ring, Spielberg",
    "datetime_fp1": convertToTimestamp("Jun 29", "09:30"),
    "datetime_fp2": convertToTimestamp("Jun 29", "13:30"),
    "datetime_fp3": convertToTimestamp("Jun 29", "09:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("Jun 29", "13:30"),
    "datetime_race": convertToTimestamp("Jun 29", "13:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "12",
    "name": "British Grand Prix",
    "location": "Silverstone Circuit, Silverstone",
    "datetime_fp1": convertToTimestamp("Jul 6", "09:30"),
    "datetime_fp2": convertToTimestamp("Jul 6", "13:30"),
    "datetime_fp3": convertToTimestamp("Jul 6", "09:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("Jul 6", "13:30"),
    "datetime_race": convertToTimestamp("Jul 6", "13:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "13",
    "name": "Belgian Grand Prix",
    "location": "Circuit de Spa-Francorchamps, Stavelot",
    "datetime_fp1": convertToTimestamp("Jul 27", "09:30"),
    "datetime_fp2": null,
    "datetime_fp3": null,
    "datetime_sprint": convertToTimestamp("Jul 27", "13:00"),
    "datetime_qualifying": convertToTimestamp("Jul 27", "13:30"),
    "datetime_race": convertToTimestamp("Jul 27", "13:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "14",
    "name": "Hungarian Grand Prix",
    "location": "Hungaroring, Mogyoród",
    "datetime_fp1": convertToTimestamp("Aug 3", "09:30"),
    "datetime_fp2": convertToTimestamp("Aug 3", "13:30"),
    "datetime_fp3": convertToTimestamp("Aug 3", "09:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("Aug 3", "13:30"),
    "datetime_race": convertToTimestamp("Aug 3", "13:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "15",
    "name": "Dutch Grand Prix",
    "location": "Circuit Zandvoort, Zandvoort",
    "datetime_fp1": convertToTimestamp("Aug 31", "09:30"),
    "datetime_fp2": convertToTimestamp("Aug 31", "13:30"),
    "datetime_fp3": convertToTimestamp("Aug 31", "09:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("Aug 31", "13:30"),
    "datetime_race": convertToTimestamp("Aug 31", "13:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "16",
    "name": "Italian Grand Prix",
    "location": "Monza Circuit, Monza",
    "datetime_fp1": convertToTimestamp("Sep 7", "09:30"),
    "datetime_fp2": convertToTimestamp("Sep 7", "13:30"),
    "datetime_fp3": convertToTimestamp("Sep 7", "09:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("Sep 7", "13:30"),
    "datetime_race": convertToTimestamp("Sep 7", "13:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "17",
    "name": "Azerbaijan Grand Prix",
    "location": "Baku City Circuit, Baku",
    "datetime_fp1": convertToTimestamp("Sep 21", "10:30"),
    "datetime_fp2": convertToTimestamp("Sep 21", "14:30"),
    "datetime_fp3": convertToTimestamp("Sep 21", "10:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("Sep 21", "14:30"),
    "datetime_race": convertToTimestamp("Sep 21", "13:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "18",
    "name": "Singapore Grand Prix",
    "location": "Marina Bay Street Circuit, Singapore",
    "datetime_fp1": convertToTimestamp("Oct 5", "10:30"),
    "datetime_fp2": convertToTimestamp("Oct 5", "14:30"),
    "datetime_fp3": convertToTimestamp("Oct 5", "10:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("Oct 5", "14:30"),
    "datetime_race": convertToTimestamp("Oct 5", "13:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "19",
    "name": "United States Grand Prix",
    "location": "Circuit of the Americas, Austin",
    "datetime_fp1": convertToTimestamp("Oct 19", "17:30"),
    "datetime_fp2": null,
    "datetime_fp3": null,
    "datetime_sprint": convertToTimestamp("Oct 19", "21:00"),
    "datetime_qualifying": convertToTimestamp("Oct 19", "21:30"),
    "datetime_race": convertToTimestamp("Oct 19", "20:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "20",
    "name": "Mexico City Grand Prix",
    "location": "Autódromo Hermanos Rodríguez, Mexico City",
    "datetime_fp1": convertToTimestamp("Oct 26", "17:30"),
    "datetime_fp2": convertToTimestamp("Oct 26", "21:30"),
    "datetime_fp3": convertToTimestamp("Oct 26", "17:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("Oct 26", "21:30"),
    "datetime_race": convertToTimestamp("Oct 26", "20:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "21",
    "name": "São Paulo Grand Prix",
    "location": "Interlagos Circuit, São Paulo",
    "datetime_fp1": convertToTimestamp("Nov 9", "13:30"),
    "datetime_fp2": null,
    "datetime_fp3": null,
    "datetime_sprint": convertToTimestamp("Nov 9", "17:00"),
    "datetime_qualifying": convertToTimestamp("Nov 9", "17:30"),
    "datetime_race": convertToTimestamp("Nov 9", "17:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "22",
    "name": "Las Vegas Grand Prix",
    "location": "Las Vegas Strip Circuit, Paradise",
    "datetime_fp1": convertToTimestamp("Nov 22", "06:30"),
    "datetime_fp2": convertToTimestamp("Nov 22", "10:30"),
    "datetime_fp3": convertToTimestamp("Nov 22", "06:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("Nov 22", "10:30"),
    "datetime_race": convertToTimestamp("Nov 22", "08:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "23",
    "name": "Qatar Grand Prix",
    "location": "Lusail International Circuit, Lusail",
    "datetime_fp1": convertToTimestamp("Nov 30", "11:30"),
    "datetime_fp2": null,
    "datetime_fp3": null,
    "datetime_sprint": convertToTimestamp("Nov 30", "15:00"),
    "datetime_qualifying": convertToTimestamp("Nov 30", "15:30"),
    "datetime_race": convertToTimestamp("Nov 30", "15:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  },
  {
    "round": "24",
    "name": "Abu Dhabi Grand Prix",
    "location": "Yas Marina Circuit, Abu Dhabi",
    "datetime_fp1": convertToTimestamp("Dec 7", "10:30"),
    "datetime_fp2": convertToTimestamp("Dec 7", "14:30"),
    "datetime_fp3": convertToTimestamp("Dec 7", "10:30"),
    "datetime_sprint": null,
    "datetime_qualifying": convertToTimestamp("Dec 7", "14:30"),
    "datetime_race": convertToTimestamp("Dec 7", "13:00"),
    "first_place": null,
    "second_place": null,
    "third_place": null
  }
];

// Function to add races to the API
async function addRaces() {
  try {
    // Send each race individually
    for (const race of races) {
      console.log(`Sending race: ${race.name}`);
      
      const response = await fetch('http://localhost:3000/api/races', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(race) // Send a single race object
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response for ${race.name}: ${errorText}`);
        throw new Error(`HTTP error! Status: ${response.status} for race ${race.name}`);
      }

      const data = await response.json();
      console.log(`Race ${race.name} added successfully!`);
    }
    
    console.log('All races added successfully!');
  } catch (error) {
    console.error('Error adding races:', error);
  }
}

// Run the function
addRaces(); 