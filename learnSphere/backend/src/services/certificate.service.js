import Certificate from '../models/Certificate.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { uploadToStorage } from './storage.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CertificateService {
  // Generate a certificate for a user
  static async generateCertificate({
    userId,
    courseId,
    studentName,
    courseName,
    instructorName = 'LearnSphere Team',
    completionDate = new Date(),
    expiryDate = null,
    grade = null,
    credits = null,
    skills = [],
    metadata = {}
  }) {
    // Check if certificate already exists
    const existingCert = await Certificate.findOne({ userId, courseId });
    if (existingCert) {
      return existingCert;
    }

    // Generate certificate number
    const certNumber = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create certificate in database first
    const certificate = new Certificate({
      studentId: userId,
      courseId,
      certificateNumber: certNumber,
      studentName,
      courseName,
      instructorName,
      completedAt: completionDate,
      expiresAt: expiryDate,
      grade,
      credits,
      skills,
      metadata,
      // URL will be updated after generating the PDF
      certificateUrl: '',
      verificationUrl: `${process.env.BASE_URL}/verify/${certNumber}`
    });

    // Generate QR code for verification
    const qrCodeData = JSON.stringify({
      certificateNumber: certNumber,
      studentId: userId,
      courseId,
      issueDate: completionDate.toISOString(),
      verificationUrl: certificate.verificationUrl
    });

    const qrCodeUrl = await QRCode.toDataURL(qrCodeData);
    certificate.qrCodeUrl = qrCodeUrl;

    // Generate PDF certificate
    const pdfBytes = await this.generatePDFCertificate({
      ...certificate.toObject(),
      qrCodeUrl
    });

    // Upload PDF to storage
    const fileName = `certificates/${certNumber}.pdf`;
    const fileUrl = await uploadToStorage(fileName, pdfBytes, 'application/pdf');
    
    // Update certificate with the URL
    certificate.certificateUrl = fileUrl;
    await certificate.save();

    return certificate;
  }

  // Generate PDF certificate
  static async generatePDFCertificate(certificate) {
    const templatePath = path.join(__dirname, '../../templates/certificate-template.pdf');
    const templateBytes = fs.readFileSync(templatePath);
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    
    // Load fonts
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Draw certificate content
    const drawText = (text, y, size = 30, isBold = true, x = width / 2) => {
      const textWidth = (isBold ? font : regularFont).widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: x - (textWidth / 2),
        y,
        size,
        font: isBold ? font : regularFont,
        color: rgb(0, 0, 0),
      });
    };
    
    // Certificate title
    drawText('CERTIFICATE OF COMPLETION', height - 200, 30);
    
    // This certifies that
    drawText('This is to certify that', height - 250, 18, false);
    
    // Student name
    drawText(certificate.studentName, height - 300, 36);
    
    // Course completion text
    drawText(
      `has successfully completed the course "${certificate.courseName}"`, 
      height - 360, 
      16, 
      false
    );
    
    // Completion date
    drawText(
      `on ${new Date(certificate.completedAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, 
      height - 400, 
      14, 
      false
    );
    
    // Instructor signature
    drawText(certificate.instructorName, 150, 14, true, 100);
    drawText('Instructor', 120, 12, false, 100);
    
    // Certificate number
    drawText(`Certificate ID: ${certificate.certificateNumber}`, 80, 10, false, width / 2);
    
    // Add QR code
    if (certificate.qrCodeUrl) {
      const qrCodeImageBytes = await fetch(certificate.qrCodeUrl).then(res => res.arrayBuffer());
      const qrCodeImage = await pdfDoc.embedPng(qrCodeImageBytes);
      const qrCodeDims = qrCodeImage.scale(0.5);
      
      page.drawImage(qrCodeImage, {
        x: width - 120,
        y: 50,
        width: qrCodeDims.width,
        height: qrCodeDims.height,
      });
      
      drawText('Scan to verify', 40, 10, false, width - 60);
    }
    
    // Add watermark
    const watermark = 'LearnSphere Certificate';
    const watermarkFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const watermarkSize = 60;
    const watermarkWidth = watermarkFont.widthOfTextAtSize(watermark, watermarkSize);
    const watermarkHeight = watermarkFont.heightAtSize(watermarkSize);
    
    page.drawText(watermark, {
      x: (width - watermarkWidth) / 2,
      y: (height - watermarkHeight) / 2,
      size: watermarkSize,
      font: watermarkFont,
      color: rgb(0.95, 0.95, 0.95),
      rotate: Math.PI / 4,
      opacity: 0.2
    });
    
    // Save the PDF
    return await pdfDoc.save();
  }
  
  // Verify a certificate
  static async verifyCertificate(certificateNumber) {
    const certificate = await Certificate.findOne({ certificateNumber });
    
    if (!certificate) {
      return { 
        isValid: false, 
        reason: 'Certificate not found',
        status: 404
      };
    }
    
    const now = new Date();
    const isExpired = certificate.expiresAt && new Date(certificate.expiresAt) < now;
    
    if (isExpired) {
      return { 
        isValid: false, 
        reason: 'Certificate has expired',
        status: 410,
        certificate: certificate.toObject()
      };
    }
    
    if (!certificate.isValid) {
      return { 
        isValid: false, 
        reason: certificate.revocationReason || 'Certificate has been revoked',
        status: 410,
        certificate: certificate.toObject()
      };
    }
    
    return { 
      isValid: true, 
      certificate: certificate.toObject(),
      status: 200
    };
  }
  
  // Revoke a certificate
  static async revokeCertificate(certificateNumber, reason = 'revoked') {
    const certificate = await Certificate.findOne({ certificateNumber });
    
    if (!certificate) {
      throw new Error('Certificate not found');
    }
    
    certificate.isValid = false;
    certificate.revocationReason = reason;
    certificate.revokedAt = new Date();
    
    await certificate.save();
    return certificate;
  }
  
  // Get user's certificates
  static async getUserCertificates(userId, { limit = 10, page = 1 } = {}) {
    const query = { studentId: userId };
    
    const certificates = await Certificate.find(query)
      .sort({ issuedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    const total = await Certificate.countDocuments(query);
    
    return {
      certificates,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  // Get course certificates
  static async getCourseCertificates(courseId, { limit = 10, page = 1 } = {}) {
    const query = { courseId };
    
    const certificates = await Certificate.find(query)
      .sort({ issuedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    const total = await Certificate.countDocuments(query);
    
    return {
      certificates,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  // Generate certificate share links
  static async generateShareLinks(certificateId, userId) {
    const certificate = await Certificate.findOne({ 
      _id: certificateId, 
      studentId: userId 
    });
    
    if (!certificate) {
      throw new Error('Certificate not found or access denied');
    }
    
    // Generate a unique token for sharing
    const shareToken = uuidv4();
    certificate.shareToken = shareToken;
    await certificate.save();
    
    return {
      shareableLink: `${process.env.FRONTEND_URL}/certificate/share/${shareToken}`,
      embedCode: `<iframe src="${process.env.API_URL}/api/certificates/embed/${shareToken}" width="600" height="450" frameborder="0" style="border:0" allowfullscreen></iframe>`,
      expiresIn: '30d' // Token expiration could be implemented
    };
  }
}

export default CertificateService;
