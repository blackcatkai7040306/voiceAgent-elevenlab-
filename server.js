const express = require('express');
const cors = require('cors');
const socketIo = require('socket.io');
const { runAutomation } = require('./automation');
const app = express();
const { createClient } = require('@supabase/supabase-js');
const http = require('http'); // Changed from https to http
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const path = require('path');
const supabaseUrl = 'https://xgiofapasqmxfrxcjydo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnaW9mYXBhc3FteGZyeGNqeWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDEzMjgsImV4cCI6MjA2OTk3NzMyOH0.R08E-WKz6iWVYqfoW1cR8Rv19SjzubQ3f91zq3GONM4';
const supabase = createClient(supabaseUrl, supabaseKey);

const server = http.createServer(app); 
const socketmap = {};
const io = socketIo(server, {
  cors: {
    origin: "https://voice-agent-elevenlab.vercel.app",
    methods: ["GET", "POST"]
  }
});

io.on('connect', (socket) => {
  console.log('Client connected:', socket.id);
  console.log('Socket map:', socketmap);
  socket.on('coneversationId', (conversationId) => {  
    console.log('Received conversationId:', conversationId);
    socketmap[conversationId] = socket.id;
    console.log('Socket map updated:', socketmap);
  });
  
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
      
    const { conversation_id, first_name, last_name,  savedmoney, retirementdate, birthday } = req.body;
    console.log('Received conversation_id:', conversation_id);

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
   


    const supabaseData = {
      first_name: first_name,
      last_name:  last_name,
      birth: birthDate.toISOString().split('T')[0], // 'YYYY-MM-DD'
      retirement_date: retireDate.toISOString().split('T')[0], // 'YYYY-MM-DD'
      savings: parseInt(savedmoney, 10),
      estimated_paycheck: result.monthlyIncomeNet ? parseInt(result.monthlyIncomeNet.replace(/[^0-9]/g, ''), 10) : null
    };

     const { data, error: supabaseError } = await supabase
      .from('ExtractedInfo') // <-- Replace with your actual table name
      .insert([supabaseData]);

    if (supabaseError) {
      console.error('Supabase insert error:', supabaseError);
    } else {
      console.log('Supabase insert success:', data);
    }


    console.log('Automation result:', result);

    if(result) {
      console.log('------------📊 Start of Plan values:----------');
      console.log(result);
      io.emit('automation-result', {
      success: true,
      monthlyIncomeNet: result.monthlyIncomeNet
    });
    } else {
      console.error('No results found');
      io.emit('automation-result', {
        success: false,
        message: 'No results found'
      });

    }
    console.log('------------📊 res.json of Plan values:----------');
    res.json({
      success: true,
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

app.post('/fill-form', async (req, res) => {
  try {
    console.log(req.body);
    const data = req.body;

    const existingPdfBytes = fs.readFileSync('1.pdf');
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    Object.keys(data).map(key=>{
      form.getTextField(key).setText(data[key]);
    })

    const pdfBytes = await pdfDoc.save();

    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-'); // e.g., 2025-08-07T14-23-45-123Z
    const filename = `filled_form-${dateStr}.pdf`;

    const dir = path.join(__dirname, 'filled_form');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

   
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, pdfBytes);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBytes.length
    });
    res.send(pdfBytes);

    // Emit event to notify clients
  } 
  catch (error) {
    console.error('Error in /fill-form:', error);
    res.status(500).json({ success: false, error: error.message });
      }
  } 
);

server.listen(port, () => {
   
  console.log(`🚀 Server running on port ${port}`);
});
