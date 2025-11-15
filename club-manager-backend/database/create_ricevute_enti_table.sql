-- Create RicevuteEnti table for managing receipts from entities/institutions
-- This table stores simplified receipts with only date, entity name, and amount
-- All payments are considered as Bonifico (bank transfer)

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RicevuteEnti')
BEGIN
    CREATE TABLE RicevuteEnti (
        id INT IDENTITY(1,1) PRIMARY KEY,
        dataRicevuta DATE NOT NULL,
        ente NVARCHAR(255) NOT NULL,
        importo INT NOT NULL, -- Amount in cents (Euro)
        created_at DATETIME2 DEFAULT GETDATE(),

        INDEX IX_RicevuteEnti_DataRicevuta (dataRicevuta),
        INDEX IX_RicevuteEnti_Ente (ente)
    );

    PRINT 'Table RicevuteEnti created successfully';
END
ELSE
BEGIN
    PRINT 'Table RicevuteEnti already exists';
END
GO
