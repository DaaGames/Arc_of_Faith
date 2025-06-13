const express = require('express');
const fetch = require('node-fetch'); // or native fetch if using Node 18+
const app = express();
const PORT = process.env.PORT || 3000;

// Your Printify API token (with all required scopes)
const PRINTIFY_API_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6ImM3MGFmZTE3ZWE4ZTM3ZTM0MTgzYmMwZjNmYWMxZmM0YmNmMGNkY2U4N2M0YmJiYmZmZWU0NmU0MzU2OGNjNmVlYjcyN2Y2NzYxZjE0MjM3IiwiaWF0IjoxNzQ5NzgwODA2LjcxNjgwNCwibmJmIjoxNzQ5NzgwODA2LjcxNjgwNiwiZXhwIjoxNzgxMzE2ODA2LjY5NTMxNiwic3ViIjoiMTkwNTc5OTEiLCJzY29wZXMiOlsic2hvcHMubWFuYWdlIiwic2hvcHMucmVhZCIsImNhdGFsb2cucmVhZCIsIm9yZGVycy5yZWFkIiwib3JkZXJzLndyaXRlIiwicHJvZHVjdHMucmVhZCIsInByb2R1Y3RzLndyaXRlIiwid2ViaG9va3MucmVhZCIsIndlYmhvb2tzLndyaXRlIiwidXBsb2Fkcy5yZWFkIiwidXBsb2Fkcy53cml0ZSIsInByaW50X3Byb3ZpZGVycy5yZWFkIiwidXNlci5pbmZvIl19.JjRINeTeYQCgj68Nbx9Hvt-6_W8fsXmNTrhGvcJxUOrInHIeV5fpUje5pbPiFCkG9aIOPWQdwbSFtstxaEhqnDhV8308iBmnvjPV4GVyVHJG9iWK16DxCN9nQj0w_LVujiDM9hnSn6e6k2Pd0s6wzG6-KLPjTRzgj9WvoNzOGLcbERd99V2gxw2mz8BCChnojCRRlSRl5qtr1zv0TyF7xRRTEIWWK8tfM8ExtapQWffLNwEF4oJLPS1jY2oZ3dBz5qkKDad-0Gw3sczV8NKw6eNRBg8QRsQt2qhq3pxgEWTdtm-w6Gia70utlM-td_4TEfLQz1xVAAX2Fm2phllenUpvy0zNm9L5Tz7jCTDIi4Uc_Q6lz1LZ1b-XIPoVm_FS60ftFIeuTV8RYw-ibdkF7bv0uTfTcow_G9Mp7XyAucuDhcDXsDNX_UYFXP74pum3TU5m5NSCnLPvHlbtFgFyknKZsN2-fjN2HkHikK-WIWnmLgQiFPz0J8lxeFlOsVdrLN6F_8PeAF_vDq2FrfoRe7tNaWXH6JCH-siRmpejLc2oqJXssOSxxNt57BR-8VijBY6lLaNlHiiXhL7yFidG3b-fOjTu9KHC0rvRiRSJvlRatuC9ZT402MfG2-6M_Enn5PRParXEJDnkzgHz4e_hqm1dLC2T6tn2NiFynmTrPkQ';

app.get('/api/products', async (req, res) => {
  try {
    // Replace with your Printify shop ID (find it in Printify dashboard)
    const shopId = 'YOUR_SHOP_ID';

    const response = await fetch(`https://api.printify.com/v1/shops/${shopId}/products.json`, {
      headers: {
        'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
