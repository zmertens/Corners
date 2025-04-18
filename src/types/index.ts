export interface Complex {
  id: string;
  data: string;
}

export interface ComplexDocument extends Complex {
  _id: string; // MongoDB document ID
}
