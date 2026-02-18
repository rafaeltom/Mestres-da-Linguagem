
// Serviço para manipular o Google Sheets com Fallback Local (Mock)
// ID DA PLANILHA: 1DfTd5A1VVEpboE8FFD90zjl698AmgC-a2sEwzPhmTAk

const SPREADSHEET_ID = '1DfTd5A1VVEpboE8FFD90zjl698AmgC-a2sEwzPhmTAk';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;
let accessToken: string | null = null;
let useMockData = false;

// --- DADOS MOCK INICIAIS (PARA QUANDO O OAUTH FALHAR) ---
const INITIAL_MOCK_DATA = {
  schools: [{ id: 'esc1', name: 'Escola Modelo' }],
  classes: [{ id: 'turma1', name: '9º Ano A', schoolId: 'esc1' }],
  students: [
    { id: 'st1', name: 'Ana Souza', classId: 'turma1', schoolId: 'esc1', walletAddress: 'ASD...123' },
    { id: 'st2', name: 'Carlos Lima', classId: 'turma1', schoolId: 'esc1', walletAddress: 'XYZ...789' }
  ],
  transactions: []
};

// --- FUNÇÕES DE INICIALIZAÇÃO ---

export const initGoogleClient = (callback: (success: boolean) => void) => {
  const gapi = (window as any).gapi;
  const google = (window as any).google;

  if (!gapi || !google) {
    console.warn("Google Scripts not loaded. Usando Mock.");
    useMockData = true;
    callback(false);
    return;
  }

  try {
      gapi.load('client', async () => {
        try {
            await gapi.client.init({
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            });
            gapiInited = true;
            maybeCallCallback(callback);
        } catch(e) {
            console.warn("Erro ao iniciar GAPI Client. Usando Mock.");
            useMockData = true;
            callback(false);
        }
      });

      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: '218248723844-p1069502758178129759.apps.googleusercontent.com',
        scope: SCOPES,
        callback: (resp: any) => {
          if (resp.error !== undefined) {
            console.error("Erro OAuth:", resp);
            throw (resp);
          }
          accessToken = resp.access_token;
          callback(true);
        },
      });
      gisInited = true;
  } catch(e) {
      console.error("Falha geral na inicialização Google:", e);
      useMockData = true;
      callback(false);
  }
};

const maybeCallCallback = (cb: (s: boolean) => void) => {
  if (gapiInited && gisInited) {
      // Estamos prontos para tentar login, mas ainda não logados
      // Callback será chamado após loginToGoogle
  }
};

export const loginToGoogle = async (): Promise<boolean> => {
  if (useMockData) return false;
  
  if (tokenClient) {
    return new Promise((resolve) => {
        try {
            // Sobrescrevemos o callback temporariamente para pegar o resultado deste login específico
            tokenClient.callback = (resp: any) => {
                if (resp.error) {
                    console.error("Erro no login:", resp.error);
                    useMockData = true;
                    resolve(false);
                } else {
                    accessToken = resp.access_token;
                    resolve(true);
                }
            };
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (e) {
            console.error("Erro ao solicitar token:", e);
            useMockData = true;
            resolve(false);
        }
    });
  }
  useMockData = true;
  return false;
};

// --- ABSTRAÇÃO DE DADOS (INTERAGEM COM GOOGLE OU LOCALSTORAGE) ---

export const fetchAllData = async () => {
  if (useMockData || !accessToken) {
    console.log("Fetching Data from LOCAL STORAGE (Mock Mode)");
    return getLocalData();
  }

  // Se tiver token, tenta pegar do Google
  try {
      const gapi = (window as any).gapi;
      
      // Config
      const configRes = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID, range: 'Config!A2:C'
      });
      
      // Alunos
      const studRes = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID, range: 'Alunos!A2:E'
      });
      
      // Transações
      const txRes = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID, range: 'Transacoes!A2:F'
      });

      return processRawData(configRes.result.values, studRes.result.values, txRes.result.values);
  } catch (err) {
      console.error("Erro na API Google Sheets, revertendo para local:", err);
      useMockData = true;
      return getLocalData();
  }
};

export const addTransactionToSheet = async (studentId: string, amount: number, description: string, type: string) => {
  const row = [new Date().toISOString(), studentId, amount, description, type, ''];
  
  if (useMockData || !accessToken) {
    saveLocalTransaction(row);
    return;
  }

  try {
    const gapi = (window as any).gapi;
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Transacoes!A:F',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });
  } catch(e) {
    console.error("Erro ao salvar transação online, salvando localmente.", e);
    saveLocalTransaction(row);
  }
};

export const addStudentToSheet = async (student: any) => {
  const row = [student.id, student.name, student.classId, student.schoolId, student.walletAddress || ''];
  
  if (useMockData || !accessToken) {
    saveLocalStudent(row);
    return;
  }

  try {
    const gapi = (window as any).gapi;
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Alunos!A:E',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });
  } catch(e) {
     saveLocalStudent(row);
  }
};


// --- MÉTODOS AUXILIARES LOCAIS (MOCK) ---

const getLocalData = () => {
    // Tenta ler do localStorage, se não existir, usa inicial
    const stored = localStorage.getItem('mestres_linguagem_db');
    let db = stored ? JSON.parse(stored) : INITIAL_MOCK_DATA;
    
    // Processa estrutura para o formato do app (igual ao processRawData)
    // Precisamos simular as "linhas" da planilha
    
    // Schools & Classes
    const schools = db.schools.map((s:any) => ({ ...s, classes: [] }));
    const classes = db.classes.map((c:any) => ({ ...c }));
    schools.forEach((s:any) => s.classes = classes.filter((c:any) => c.schoolId === s.id));

    // Students
    const students = db.students.map((s:any) => ({
        ...s,
        lxcTotal: { 1: 0, 2: 0, 3: 0, 4: 0 },
        badges: [],
        messages: []
    }));

    // Transactions & Balance Calc
    const transactions: any[] = [];
    if (db.transactions) {
        db.transactions.forEach((tx: any) => {
            transactions.push({
                id: Math.random().toString(),
                date: new Date(tx.date),
                studentId: tx.studentId,
                amount: tx.amount,
                description: tx.description,
                type: tx.type,
                studentName: students.find((s:any) => s.id === tx.studentId)?.name
            });
            const st = students.find((s:any) => s.id === tx.studentId);
            if(st) st.lxcTotal[1] = (st.lxcTotal[1] || 0) + tx.amount;
        });
    }

    return { schools, classes, students, transactions };
};

const saveLocalTransaction = (row: any[]) => {
    const stored = localStorage.getItem('mestres_linguagem_db');
    let db = stored ? JSON.parse(stored) : INITIAL_MOCK_DATA;
    if (!db.transactions) db.transactions = [];
    
    db.transactions.push({
        date: row[0], studentId: row[1], amount: row[2], description: row[3], type: row[4]
    });
    localStorage.setItem('mestres_linguagem_db', JSON.stringify(db));
};

const saveLocalStudent = (row: any[]) => {
    const stored = localStorage.getItem('mestres_linguagem_db');
    let db = stored ? JSON.parse(stored) : INITIAL_MOCK_DATA;
    
    db.students.push({
        id: row[0], name: row[1], classId: row[2], schoolId: row[3], walletAddress: row[4]
    });
    localStorage.setItem('mestres_linguagem_db', JSON.stringify(db));
};

// --- PROCESSAMENTO COMUM ---

const processRawData = (configRows: any[] = [], studRows: any[] = [], txRows: any[] = []) => {
  // 1. Config
  const schools: any[] = [];
  const classes: any[] = [];
  
  if (configRows) {
    configRows.forEach((row: any) => {
      if (row[0] === 'ESCOLA') schools.push({ id: row[2], name: row[1], classes: [] });
      if (row[0] === 'TURMA') classes.push({ id: Math.random().toString(36), name: row[1], schoolId: row[2] });
    });
  }
  schools.forEach(s => s.classes = classes.filter((c:any) => c.schoolId === s.id));

  // 2. Alunos
  const students: any[] = [];
  if (studRows) {
    studRows.forEach((row: any) => {
      students.push({
        id: row[0], name: row[1], classId: row[2], schoolId: row[3], walletAddress: row[4] || '',
        lxcTotal: { 1: 0, 2: 0, 3: 0, 4: 0 }, badges: [], messages: []
      });
    });
  }

  // 3. Transações
  const transactions: any[] = [];
  if (txRows) {
    txRows.forEach((row: any) => {
      const amount = Number(row[2]);
      const studentId = row[1];
      transactions.push({
        id: Math.random().toString(),
        date: new Date(row[0]),
        studentId: studentId,
        amount: amount,
        description: row[3],
        type: row[4],
        studentName: students.find(s => s.id === studentId)?.name
      });
      const student = students.find(s => s.id === studentId);
      if (student) student.lxcTotal[1] = (student.lxcTotal[1] || 0) + amount;
    });
  }

  return { schools, classes, students, transactions };
};
