import requests
from datetime import datetime
from datetime import date

# API endpoint to retrieve soci
BASE_URL = "https://server.mathric.com/cso/rest/socio/retrieveLibroSocio/0/{start}/{end}/2"

# Your target endpoint to create a socio (replace with your actual URL)
CREATE_SOCIO_URL = "https://backend-cso.azurewebsites.net/api/socio/createSocio"

def convert_sesso(sex_value: int) -> str:
    """Convert integer sesso to 'M' or 'F'."""
    return "M" if sex_value == 1 else "F"

def format_date(date_str: str, input_fmt: str = "%Y-%m-%d", output_fmt: str = "%d-%m-%Y") -> str:
    """Convert date formats."""
    try:
        return datetime.strptime(date_str, input_fmt).strftime(output_fmt)
    except Exception:
        return None

def transform_record(record: dict) -> dict:
    """Transform a record from source API to target API structure."""

    return {
        "nome": record.get("nome"),
        "cognome": record.get("cognome"),
        "sesso": convert_sesso(record.get("sesso")),
        "dataNascita": format_date(record.get("birhDate")),  # typo in API -> birhDate
        "provinciaNascita": record.get("birthProv"),
        "comuneNascita": record.get("birthCity"),
        "provinciaResidenza": record.get("provRes"),
        "comuneResidenza": record.get("citta"),
        "viaResidenza": record.get("indirizzo"),
        "capResidenza": str(record.get("cap")) if record.get("cap") else None,
        "dataIscrizione": (
            record.get("dataInscrizione")
            and datetime.strptime(record["dataInscrizione"], "%Y-%m-%d").strftime("%d-%m-%Y")
        ),
        "isTesserato": 0,
        "isEffettivo": 0,  # business rule: default true
        "isVolontario": 0,  # business rule: default false
        "scadenzaCertificato": (
            format_date(record.get("scadenzaCertificatMedical"), "%d/%m/%Y")
            if record.get("scadenzaCertificatMedical") else None
        ),
        "isAgonistico": 1 if (record.get("attivita1") and "Agonistico" in record["attivita1"].get("attivita","")) else 0,
        "telefono": record.get("tel") or "",
        "email": record.get("email") or "",
        "privacy": 1 if record.get("privacy") else 0,
        "codice": None
    }

def fetch_and_migrate(start: int, end: int):
    """Fetch records and create socios."""
    url = BASE_URL.format(start=start, end=end)
    response = requests.get(url)
    response.raise_for_status()
    
    soci = response.json()
    for socio in soci:
        body = transform_record(socio)
        print(f"Creating socio: {body['nome']} {body['cognome']} ...")
        
        # POST request to create socio
        res = requests.post(CREATE_SOCIO_URL, json=body)
        if res.status_code == 200:
            print("✅ Created successfully")
        else:
            print(f"❌ Error {res.status_code}: {res.text}")

if __name__ == "__main__":
    # Example: fetch IDs from 50 to 100
    fetch_and_migrate(3, 3)
