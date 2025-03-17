export interface CompanyData {
  fullName: string;
  person: string;
  uid: string;
  address: string;
}

function mapToCompanyData(json: any): CompanyData {
  return {
    fullName: json.fullName,
    person: `${json.sections.person.firstName} ${json.company.person.lastName}`,
    uid: json.company.uid,
    address: `${json.company.location.street}, ${json.company.location.city}, ${json.company.location.zip}`
  };
}

// Example usage:
const jsonData = {
  "deedStatus": 2,
  "companyName": "БИО СТЕМ ТРЕЙД",
  "uic": "131231725",
  "uicWithCtx": "MTMxMjMxNzI1JtCR0JjQniDQodCi0JXQnCDQotCg0JXQmdCU4B4QTQrsNmrjRh2e_TDqwTqrd7rFBetV_6c77NwPaSU",
  "legalForm": 10,
  "sections": [
      {
          "subUICType": 1,
          "nameCode": "CR_GL_GENERAL_STATUS_L",
          "order": "20001",
          "subDeeds": [
              {
                  "subUIC": "0014",
                  "subUICType": 1,
                  "subDeedStatus": 2,
                  "sectionName": "CR_GL_GENERAL_STATUS_L",
                  "subDeedIsClosed": false,
                  "groups": [
                      {
                          "groupID": 415,
                          "nameCode": "CR_GL_MAIN_CIRCUMSTANCES_L",
                          "order": "20001",
                          "fields": [
                              {
                                  "nameCode": "CR_F_1_L",
                                  "htmlData": "<div class='record-container record-container--preview'><p class='field-text'>131231725<br/>Фирмено дело: 3840/2004 110</p></div>",
                                  "fieldEntryNumber": "20100415151649",
                                  "recordMinActionDate": "2010-04-15T15:16:49",
                                  "fieldEntryDate": "2010-04-15T15:16:49",
                                  "fieldActionDate": "2010-04-15T15:16:49",
                                  "fieldIdent": "00010",
                                  "fieldOperation": 3,
                                  "order": "00010"
                              },
                              {
                                  "nameCode": "CR_F_2_L",
                                  "htmlData": "<div class='record-container record-container--preview'><p class='field-text'>БИО СТЕМ ТРЕЙД</p></div>",
                                  "fieldEntryNumber": "20171212161909",
                                  "recordMinActionDate": "2010-04-15T15:16:49",
                                  "fieldEntryDate": "2017-12-12T16:19:09",
                                  "fieldActionDate": "2017-12-12T16:19:09",
                                  "fieldIdent": "00020",
                                  "fieldOperation": 3,
                                  "order": "00020"
                              },
                              {
                                  "nameCode": "CR_F_3_L",
                                  "htmlData": "<div class='record-container record-container--preview'><p class='field-text'>Еднолично дружество с ограничена отговорност</p></div>",
                                  "fieldEntryNumber": "20100415151649",
                                  "recordMinActionDate": "2010-04-15T15:16:49",
                                  "fieldEntryDate": "2010-04-15T15:16:49",
                                  "fieldActionDate": "2010-04-15T15:16:49",
                                  "fieldIdent": "00030",
                                  "fieldOperation": 3,
                                  "order": "00030"
                              },
                              {
                                  "nameCode": "CR_F_4_L",
                                  "htmlData": "<div class='record-container record-container--preview'><p class='field-text'>BIO STEM TRADE   Ltd</p></div>",
                                  "fieldEntryNumber": "20171212161909",
                                  "recordMinActionDate": "2010-04-15T15:16:49",
                                  "fieldEntryDate": "2017-12-12T16:19:09",
                                  "fieldActionDate": "2017-12-12T16:19:09",
                                  "fieldIdent": "00040",
                                  "fieldOperation": 3,
                                  "order": "00040"
                              },
                              {
                                  "nameCode": "CR_F_5_L",
                                  "htmlData": "<div class='record-container record-container--preview'><p class='field-text'>Държава: БЪЛГАРИЯ<br/>Област: София (столица), Община: Столична<br />Населено място: гр. София, п.к. 1408<br />р-н Триадица<br/>бул./ул. бул. ВИТОША бл. 200 вх.Б ет.2 ап.24 </p></div>",
                                  "fieldEntryNumber": "20171212161909",
                                  "recordMinActionDate": "2010-04-15T15:16:49",
                                  "fieldEntryDate": "2017-12-12T16:19:09",
                                  "fieldActionDate": "2017-12-12T16:19:09",
                                  "fieldIdent": "00050",
                                  "fieldOperation": 3,
                                  "order": "00050"
                              },
                              {
                                  "nameCode": "CR_F_6_L",
                                  "htmlData": "<div class='record-container record-container--preview'><p class='field-text'>“Внос и  износ на фармацевтични продукти и медицинска апаратура, внос и търговия на едро и дребно с лекарства, лекарствени средства и медицински изделия, търговско представителство, посредничество и агентство на местни и чуждестранни физически и юридически лица в страната и чужбина, вътрешна и външна търговия, както и всяка друга дейност и услуги с изключение на изрично забранените със закон.\"</p></div>",
                                  "fieldEntryNumber": "20171212161909",
                                  "recordMinActionDate": "2010-04-15T15:16:49",
                                  "fieldEntryDate": "2017-12-12T16:19:09",
                                  "fieldActionDate": "2017-12-12T16:19:09",
                                  "fieldIdent": "00060",
                                  "fieldOperation": 3,
                                  "order": "00060"
                              },
                              {
                                  "nameCode": "CR_F_7_L",
                                  "htmlData": "<div class='record-container record-container--preview'><p class='field-text'>ЕКАТЕРИНА ДОБРИНОВА ДАНЧЕВА, Държава: БЪЛГАРИЯ</p></div>",
                                  "fieldEntryNumber": "20100415151649",
                                  "fieldEntryDate": "2010-04-15T15:16:49",
                                  "fieldActionDate": "2010-04-15T15:16:49",
                                  "fieldIdent": "00070",
                                  "fieldOperation": 3,
                                  "order": "00070"
                              },
                              {
                                  "nameCode": "CR_F_23_L",
                                  "htmlData": "<div class='record-container record-container--preview'><p class='field-text'>ЕКАТЕРИНА ДОБРИНОВА ДАНЧЕВА, Държава: БЪЛГАРИЯ</p></div>",
                                  "fieldEntryNumber": "20100415151649",
                                  "recordMinActionDate": "2010-04-15T15:16:49",
                                  "fieldEntryDate": "2010-04-15T15:16:49",
                                  "fieldActionDate": "2010-04-15T15:16:49",
                                  "fieldIdent": "00230",
                                  "fieldOperation": 3,
                                  "order": "00230"
                              }
                          ]
                      },
                      {
                          "groupID": 16,
                          "nameCode": "CR_GL_FUND_L",
                          "order": "20002",
                          "fields": [
                              {
                                  "nameCode": "CR_F_31_L",
                                  "htmlData": "<div class='record-container record-container--preview'><p class='field-text'>5000 лв.</p></div>",
                                  "fieldEntryNumber": "20100415151649",
                                  "recordMinActionDate": "2010-04-15T15:16:49",
                                  "fieldEntryDate": "2010-04-15T15:16:49",
                                  "fieldActionDate": "2010-04-15T15:16:49",
                                  "fieldIdent": "00310",
                                  "fieldOperation": 3,
                                  "order": "00310"
                              },
                              {
                                  "nameCode": "CR_F_32_L",
                                  "htmlData": "<div class='record-container record-container--preview'><p class='field-text'>5000 лева</p></div>",
                                  "fieldEntryNumber": "20100415151649",
                                  "recordMinActionDate": "2010-04-15T15:16:49",
                                  "fieldEntryDate": "2010-04-15T15:16:49",
                                  "fieldActionDate": "2010-04-15T15:16:49",
                                  "fieldIdent": "00320",
                                  "fieldOperation": 3,
                                  "order": "00320"
                              }
                          ]
                      }
                  ]
              }
          ]
      },
      {
          "subUICType": 13,
          "nameCode": "CR_GL_ANNOUNCED_ACTS_L",
          "order": "20001",
          "subDeeds": [
              {
                  "subUIC": "0014",
                  "subUICType": 13,
                  "subDeedStatus": 0,
                  "sectionName": "CR_GL_ANNOUNCED_ACTS_L",
                  "subDeedIsClosed": false,
                  "groups": [
                      {
                          "groupID": 42,
                          "nameCode": "CR_GL_ANNOUNCED_ACTS_L",
                          "order": "20001",
                          "fields": [
                              {
                                  "nameCode": "CR_F_1001_L",
                                  "htmlData": "<div class='record-container record-container--preview'><p class='field-text'>Годишен финансов отчет<br/>Година: 2009г.<br /><a href='DocumentAccess/MTMxMjMxNzI1JmUmOTJkYzdlZjNiNGMyNGYwYWI1M2M3Y2NhZTFiZWQyZmTXLnVolNFsMuYQKV5cqQqpqMnoWwdFeT69PYwlPn1E_Q' target='_blank'><i class='ui-icon ui-icon-download-color mr-1'></i>Годишен финансов отчет</a><br/>Дата на обявяване: 23.12.2010 г. 10:59:10</p></div><hr class='hr--report' /><div class='record-container record-container--preview'><p class='field-text'>Годишен финансов отчет<br/>Година: 2008г.<br /><a href='DocumentAccess/MTMxMjMxNzI1JmUmODMxZGVmYWE3YTFjNGE0MmJkYmM2NDg3M2RjNWMyOTn2I3Hul0uF6UCGNWIFRAGq7kYYSrl9iDklvoOpnfhtCw' target='_blank'><i class='ui-icon ui-icon-download-color mr-1'></i>Годишен финансов отчет</a><br/>Дата на обявяване: 23.12.2010 г. 10:59:10</p></div><hr class='hr--report' /><div class='record-container record-container--preview'><p class='field-text'>Годишен финансов отчет<br/>Година: 2007г.<br /><a href='DocumentAccess/MTMxMjMxNzI1JmUmMzkxNDZkMWE3NzRhNGI5N2I4NWE1YWRmMWUxYzU3YzDRgKG-VY1JhoKeU2-wb6mB1CW-prnJL5YI-fp4rLH3XQ' target='_blank'><i class='ui-icon ui-icon-download-color mr-1'></i>Годишен финансов отчет</a><br/>Дата на обявяване: 23.12.2010 г. 10:59:10</p></div><hr class='hr--report' /><div class='record-container record-container--preview'><p class='field-text'>Годишен финансов отчет<br/>Година: 2010г.<br /><a href='DocumentAccess/MTMxMjMxNzI1JmUmYzI1N2NhMTllNWFjNGYxYmE4ZmMwNWIzYThhYzk2YmaTIqIukk6ywIFyGt68A1Ii4yjR1WSItRXYVo9GGn_Z4g' target='_blank'><i class='ui-icon ui-icon-download-color mr-1'></i>Годишен финансов отчет</a><br/>Дата на обявяване: 23.12.2011 г. 13:11:28</p></div><hr class='hr--report' /><div class='record-container record-container--preview'><p class='field-text'>Годишен финансов отчет<br/>Година: 2011г.<br /><a href='DocumentAccess/MTMxMjMxNzI1JmUmMjE3OTNkZGQyOWVhNDJlYmI4Y2IzNWZlMTViOWQ0YTPiMLZaDxAFjqpbX1cDX6nTa_89a2ixo-6lTSrl5yXOCw' target='_blank'><i class='ui-icon ui-icon-download-color mr-1'></i>Годишен финансов отчет</a><br/>Дата на обявяване: 20.09.2012 г. 15:53:55</p></div><hr class='hr--report' /><div class='record-container record-container--preview'><p class='field-text'>Годишен финансов отчет<br/>Година: 2012г.<br /><a href='DocumentAccess/MTMxMjMxNzI1JmUmY2YwZTVlNTk3MTE3NDNkYjgzOWEwMGQwMDgzNmNiMjJrndaPEFvvPGtoBHPwowBdwugp4lIhe7zSupB7aaKXYg' target='_blank'><i class='ui-icon ui-icon-download-color mr-1'></i>Годишен финансов отчет</a><br/>Дата на обявяване: 17.02.2014 г. 08:19:39</p></div><hr class='hr--report' /><div class='record-container record-container--preview'><p class='field-text'>Годишен финансов отчет<br/>Година: 2013г.<br /><a href='DocumentAccess/MTMxMjMxNzI1JmUmMDMzNzdmYzRmZTdkNDhjNWI1NDg2ZWY3MTg3ZDQ1MzUUA0kT-RlegO72YnAEbCtfwIbmI1u0Cb_qLa0m5DS6eg' target='_blank'><i class='ui-icon ui-icon-download-color mr-1'></i>Годишен финансов отчет</a><br/>Дата на обявяване: 27.08.2014 г. 14:07:28</p></div><hr class='hr--report' /><div class='record-container record-container--preview'><p class='field-text'>Годишен финансов отчет<br/>Година: 2014г.<br /><a href='DocumentAccess/MTMxMjMxNzI1JmUmZTYzNGJjYmZjMzBjNDNjMWIwZGFmNWJmYjI1NDc4ZDO-m7tKrBd308VD3Pxp5YZ-sbOyaMsareBCJMYxntwPPw' target='_blank'><i class='ui-icon ui-icon-download-color mr-1'></i>Годишен финансов отчет</a><br/>Дата на обявяване: 16.11.2015 г. 08:31:24</p></div><hr class='hr--report' /><div class='record-container record-container--preview'><p class='field-text'>Годишен финансов отчет<br/>Година: 2015г.<br /><a href='DocumentAccess/MTMxMjMxNzI1JmUmZWYyMDgxYmIxMTYyNDgxMGI4MDRhMWMwNmI1MmZiY2Q18IBvFvgnS3QIXWw-IM6sfZwnS4p620Ogh1REdzLiBA' target='_blank'><i class='ui-icon ui-icon-download-color mr-1'></i>Годишен финансов отчет</a><br/>Дата на обявяване: 07.12.2017 г. 16:14:36</p></div><hr class='hr--report' /><div class='record-container record-container--preview'><p class='field-text'>Годишен финансов отчет<br/>Година: 2016г.<br /><a href='DocumentAccess/MTMxMjMxNzI1JmUmOWIyMThkNTYyOWNmNGViMGE1M2I5ZjgyY2M3ODJiYTdZsPponA-YAdFr7YpfPjJLsEw_JeK04atOWPXDvK2xOQ' target='_blank'><i class='ui-icon ui-icon-download-color mr-1'></i>Годишен финансов отчет</a><br/>Дата на обявяване: 07.12.2017 г. 16:16:59</p></div><hr class='hr--report' /><div class='record-container record-container--preview'><p class='field-text'>Годишен финансов отчет<br/>Година: 2019г.<br /><a href='DocumentAccess/MTMxMjMxNzI1JmUmM2M1MTZlMmUzNjM3NDVhNzgyZWViODczNTNmODRlM2IyIyEAxvnO4ergxgT8GMw-ZmTXTCXY1EabPhjuObvI7w' target='_blank'><i class='ui-icon ui-icon-download-color mr-1'></i>Годишен финансов отчет</a><br/>Дата на обявяване: 27.01.2023 г. 15:50:46</p></div><hr class='hr--report' /><div class='record-container record-container--preview'><p class='field-text'>Годишен финансов отчет<br/>Година: 2020г.<br /><a href='DocumentAccess/MTMxMjMxNzI1JmUmZTc3ZTU0YzU1NzRmNDU4ODlhZGEyYjY4NWVhNTkzNTg1Xh9QK6zyO97SBdBOFmo-G9VC_Lbeb6ew0k2H8yn2zw' target='_blank'><i class='ui-icon ui-icon-download-color mr-1'></i>Годишен финансов отчет</a><br/>Дата на обявяване: 18.03.2024 г. 15:26:29</p></div><hr class='hr--report' /><div class='record-container record-container--preview'><p class='field-text'>Годишен финансов отчет<br/>Година: 2021г.<br /><a href='DocumentAccess/MTMxMjMxNzI1JmUmNDQwZTcwYTlhOWM1NGUyYTk3ZTExZDJhNjRlY2EzNDmgNTVp36RrPPDWKJUDCTm7GSrTCPIXavmnzjosm1Bv8g' target='_blank'><i class='ui-icon ui-icon-download-color mr-1'></i>Годишен финансов отчет</a><br/>Дата на обявяване: 15.08.2024 г. 10:15:42</p></div>",
                                  "fieldEntryNumber": "20240815101542",
                                  "fieldEntryDate": "2024-08-15T10:15:42",
                                  "fieldActionDate": "2024-08-15T10:15:42",
                                  "fieldIdent": "10019B",
                                  "fieldOperation": 3,
                                  "order": "10010001"
                              },
                              {
                                  "nameCode": "CR_F_1001_L",
                                  "htmlData": "<div class='record-container record-container--preview'><p class='field-text'>Декларация по чл.38, ал.9, т.2 от ЗСч<br/>Година: 2017г.<br /><a href='DocumentAccess/MTMxMjMxNzI1JmUmNDU3OGI2NzRlNTNjNDM5OThkNDZiOWY4ODZlYWVjODRXhFii_QMgriqyzSAVsyH7mtg-aTOeZy8LFsNuO2GAYg' target='_blank'><i class='ui-icon ui-icon-download-color mr-1'></i>Декларация по чл.38, ал.9, т.2 от ЗСч</a><br/>Дата на обявяване: 04.12.2020 г. 17:39:36</p></div><hr class='hr--report' /><div class='record-container record-container--preview'><p class='field-text'>Декларация по чл.38, ал.9, т.2 от ЗСч<br/>Година: 2018г.<br /><a href='DocumentAccess/MTMxMjMxNzI1JmUmZGU1OGQ0MDliZTcwNDdkNmJiNGIzNzEyOTc3N2Y1YzJCrb9oIwzomoIAIWop-R8oSBMAMwxJDuWhEmcLS6Wm8w' target='_blank'><i class='ui-icon ui-icon-download-color mr-1'></i>Декларация по чл.38, ал.9, т.2 от ЗСч</a><br/>Дата на обявяване: 19.10.2021 г. 09:18:01</p></div>",
                                  "fieldEntryNumber": "20211019091801",
                                  "fieldEntryDate": "2021-10-19T09:18:01",
                                  "fieldActionDate": "2021-10-19T09:18:01",
                                  "fieldIdent": "1001BI",
                                  "fieldOperation": 3,
                                  "order": "100188"
                              }
                          ]
                      }
                  ]
              }
          ]
      },
      {
          "subUICType": 13,
          "nameCode": "CR_GL_CURRENT_CONSTUTIVE_ACT_L",
          "order": "20001",
          "subDeeds": [
              {
                  "subUIC": "0014",
                  "subUICType": 13,
                  "subDeedStatus": 0,
                  "sectionName": "CR_GL_ANNOUNCED_ACTS_L",
                  "subDeedIsClosed": false,
                  "groups": [
                      {
                          "groupID": 451,
                          "nameCode": "CR_GL_CURRENT_CONSTUTIVE_ACT_L",
                          "order": "20001",
                          "fields": [
                              {
                                  "nameCode": "CR_F_1001_L",
                                  "htmlData": "<div class='record-container record-container--preview'><p class='field-text'>Актуален дружествен договор/учредителен акт/устав<br /><a href='DocumentAccess/MTMxMjMxNzI1JmUmMWI2OWZkNTQyZmFlNGUwNTllYWJmYTllODgwYzE0NzTUQpov5q4VQMqazPMsygiFhr7O-Ja28TaWqjZ2i1EALQ' target='_blank'><i class='ui-icon ui-icon-download-color mr-1'></i>Актуален дружествен договор/учредителен акт/устав</a><br/>Дата на обявяване: 12.12.2017 г. 16:19:09</p></div>",
                                  "fieldEntryNumber": "20171212161909",
                                  "fieldEntryDate": "2017-12-12T16:19:09",
                                  "fieldActionDate": "2017-12-12T16:19:09",
                                  "fieldIdent": "1001AJ",
                                  "fieldOperation": 1,
                                  "order": "10010029"
                              }
                          ]
                      }
                  ]
              }
          ]
      }
  ],
  "fullName": "\"БИО СТЕМ ТРЕЙД\" ЕООД",
  "hasInstructions": false,
  "hasAssignments": false,
  "hasCompanyCasees": true,
  "hasLegalFormChange": false,
  "hasNotifications": false,
  "hasForeignParentCompany": false,
  "hasForeignBranches": false
};

function extractNameFromHTML(htmlData: string): string | null {
  const regex = /<p class='field-text'>(.*?)<\/p>/;
  const match = htmlData.match(regex);
  if (match) {
    return match[1].split(',')[0]; 
  }
  return null;
}

function getNameByNameCode(nameCode: string): string | null {
  const record = jsonData.sections.at(0)?.subDeeds.at(0)?.groups.at(0)?.fields?.find(item => item.nameCode === nameCode);
  console.log(nameCode)
  if (record) {
    return extractNameFromHTML(record.htmlData);
  }
  return null;
}

const name = getNameByNameCode("CR_F_7_L");

const companyData: CompanyData = mapToCompanyData(jsonData);
console.log(companyData);
