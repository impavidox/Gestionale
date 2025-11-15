-- Create ricevuteEntiRivoli table for managing receipts from entities/institutions
-- This table stores simplified receipts with only date, entity name, and amount
-- All payments are considered as Bonifico (bank transfer)

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ricevuteEntiRivoli')
BEGIN
    CREATE TABLE ricevuteEntiRivoli (
        id INT IDENTITY(1,1) PRIMARY KEY,
        dataRicevuta DATE NOT NULL,
        ente NVARCHAR(255) NOT NULL,
        importo INT NOT NULL, -- Amount in cents (Euro)
        created_at DATETIME2 DEFAULT GETDATE(),

        INDEX IX_RicevuteEntiRivoli_DataRicevuta (dataRicevuta),
        INDEX IX_RicevuteEntiRivoli_Ente (ente)
    );

    PRINT 'Table ricevuteEntiRivoli created successfully';
END
ELSE
BEGIN
    PRINT 'Table ricevuteEntiRivoli already exists';
END
GO
