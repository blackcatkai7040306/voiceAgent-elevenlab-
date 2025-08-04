const express = require('express');
const cors = require('cors');
const socketIo = require('socket.io');
const { runAutomation } = require('./automation');
const app = express();
const http = require('http'); // Changed from https to http

const server = http.createServer(app); 

const io = socketIo(server, {
  cors: {
    origin: "https://voice-agent-elevenlab.vercel.app",
    methods: ["GET", "POST"]
  }
});

io.on('connect', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use(cors({
  origin: "https://voice-agent-elevenlab.vercel.app",
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());


const port = 3001;
// Use built-in middleware for JSON body parsing
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// app.post('/webhook', async (req, res) => {
//   console.log('✅ Webhook received');

//   try {
//     const data = req.body.data.analysis.data_collection_results.user_birthday.value;
//     console.log('📦 Parsed Body:',data);

//     // Example: access specific field

//     res.status(200).send('Webhook received');
//   } catch (error) {
//     console.error('❌ Error parsing webhook data:', error.message);
//     res.status(400).send('Invalid JSON');
//   }
// });


app.post('/run-automation', async (req, res) => {
    try {


    const { savedmoney, retirementdate, birthday } = req.body;

    console.log('Received data:', { savedmoney, retirementdate, birthday });

     io.emit('automation-start', {
    });
    // Parse birthday and retirementdate
    let birthDate;
    if (/^\d{4}\s+[A-Za-z]+\s+\d{1,2}(st|nd|rd|th)?$/.test(birthday)) {
      // Example: "2004 March 6th"
      const match = birthday.match(/^(\d{4})\s+([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?$/);
      if (match) {
        const [_, year, monthStr, day] = match;
        const month = new Date(`${monthStr} 1, 2000`).getMonth() + 1;
        birthDate = new Date(`${year}-${month.toString().padStart(2, '0')}-${day.padStart(2, '0')}`);
      }
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      // Example: "1964-04-06"
      birthDate = new Date(birthday);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(birthday)) {
      // Example: "04/06/1964"
      const [month, day, year] = birthday.split('/');
      birthDate = new Date(`${year}-${month}-${day}`);
    } else {
      birthDate = new Date(birthday);
    }

    // Robust retirementdate parsing
    let retireDate;
    if (/^\d{4}$/.test(retirementdate)) {
      retireDate = new Date(`${retirementdate}-01-01`);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(retirementdate)) {
      retireDate = new Date(retirementdate);
    } else {
      retireDate = new Date(retirementdate);
    }

    // If parsing failed, set defaults
    if (isNaN(birthDate?.getTime())) {
      birthDate = new Date('1970-01-01');
    }
    if (isNaN(retireDate?.getTime())) {
      retireDate = new Date('2030-01-01');
    }

    // Calculate retirementAge, retirementYear, retirementMonth
    let retirementAge = retireDate.getFullYear() - birthDate.getFullYear();
    if (
      retireDate.getMonth() < birthDate.getMonth() ||
      (retireDate.getMonth() === birthDate.getMonth() && retireDate.getDate() < birthDate.getDate())
    ) {
      retirementAge--;
    }
    const retirementYear = retireDate.getFullYear().toString();
    const retirementMonth = (retireDate.getMonth() + 1).toString();

    // Format birthday as mm/dd/yyyy
    const birthMonth = (birthDate.getMonth() + 1).toString().padStart(2, '0');
    const birthDay = birthDate.getDate().toString().padStart(2, '0');
    const birthYear = birthDate.getFullYear().toString();
    const formattedBirthday = `${birthMonth}/${birthDay}/${birthYear}`;


    // Prepare formData for automation
    const formData = {
      investmentAmount: savedmoney.toString() || '130000',
      birthday: formattedBirthday,
      retirementAge: retirementAge.toString(),
      retirementYear,
      retirementMonth: retirementMonth || '1',
      longevityEstimate: '100'
    };

    console.log('Prepared formData:', formData);

    const result = await runAutomation(formData);
   
    console.log('Automation result:', result);

    if(result) {
      console.log('------------📊 Start of Plan values:----------');
      console.log(result);
      io.emit('automation-result', {
      success: true,
      plan1: result.plan1,
      plan2: result.plan2,
      total: result.plan3,
      monthlyIncomeNet: result.monthlyIncomeNet
    });
    } else {
      console.error('No results found');
      io.emit('automation-result', {
        success: false,
        message: 'No results found'
      });

    }
    res.json({
      success: true,
      Segment1: result.plan1,
      Segment2: result.plan2,
      Total: result.plan3,
      monthlyIncomeNet: result.monthlyIncomeNet
    });
    
  } catch (error) {
    console.error('Automation error:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});



server.listen(port, () => {
   
  console.log(`🚀 Server running on port ${port}`);
});
