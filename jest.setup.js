// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Next.js navigation and cache functions
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  revalidatePath: jest.fn(),
}));

// Mock FormData for tests
global.FormData = class FormData {
  data = {};
  
  append(key, value) {
    this.data[key] = value;
  }
  
  get(key) {
    return this.data[key] || null;
  }
  
  getAll(key) {
    return this.data[key] ? [this.data[key]] : [];
  }
};

// Mock the fingerprint module
jest.mock('@/lib/fingerprint');