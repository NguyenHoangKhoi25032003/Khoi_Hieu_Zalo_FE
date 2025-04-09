import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('Nam'); // Mặc định là Nam
  const [day, setDay] = useState('1');
  const [month, setMonth] = useState('1');
  const [year, setYear] = useState('2000');
  const [step, setStep] = useState(1);

  const validatePhoneNumber = (number) => {
    return /^\d{10,11}$/.test(number);
  };

  const handleNext = () => {
    if (step === 1) {
      if (name.trim() === '') {
        Alert.alert('Lỗi', 'Vui lòng nhập tên của bạn');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (phoneNumber.trim() === '' || !validatePhoneNumber(phoneNumber)) {
        Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại hợp lệ (10-11 số)');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      console.log('Thông tin đăng ký:', { 
        name, 
        phoneNumber, 
        gender, 
        birthDate: `${day}/${month}/${year}` 
      });
      // Xử lý đăng ký ở đây
    }
  };

  const handleBack = () => {
    if (step === 1) {
      navigation.goBack();
    } else {
      setStep(step - 1);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const years = Array.from({ length: 100 }, (_, i) => (2025 - i).toString());

  return (
    <View style={styles.container}>
      {/* Nút Trở về */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      {/* Step 1: Tên */}
      {step === 1 && (
        <>
          <Text style={styles.title}>Tên Zalo</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên của bạn"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <Text style={styles.note}>
            Lưu ý điều kiện: {'\n'}
            - Không được trùng với tên Zalo khác {'\n'}
            - Bạn có thể dùng tên đó để giúp bạn bè nhận ra bạn
          </Text>
        </>
      )}

      {/* Step 2: Số điện thoại */}
      {step === 2 && (
        <>
          <Text style={styles.title}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số điện thoại"
            placeholderTextColor="#999"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={11}
            autoFocus
          />
          <Text style={styles.note}>
            Số điện thoại sẽ được dùng để xác minh tài khoản
          </Text>
        </>
      )}

      {/* Step 3: Thông tin cá nhân */}
      {step === 3 && (
        <>
          <Text style={styles.title}>Ngày sinh và giới tính</Text>
          <Text style={styles.subtitle}>Giới tính</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[styles.genderButton, gender === 'Nam' && styles.selectedGender]}
              onPress={() => setGender('Nam')}
            >
              <Text style={[styles.genderText, gender === 'Nam' && styles.selectedGenderText]}>Nam</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, gender === 'Nữ' && styles.selectedGender]}
              onPress={() => setGender('Nữ')}
            >
              <Text style={[styles.genderText, gender === 'Nữ' && styles.selectedGenderText]}>Nữ</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Ngày sinh</Text>
          <View style={styles.dateContainer}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={day}
                onValueChange={setDay}
                dropdownIconColor="#00aeef"
              >
                {days.map((d) => (
                  <Picker.Item key={d} label={d} value={d} />
                ))}
              </Picker>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={month}
                onValueChange={setMonth}
                dropdownIconColor="#00aeef"
              >
                {months.map((m) => (
                  <Picker.Item key={m} label={m} value={m} />
                ))}
              </Picker>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={year}
                onValueChange={setYear}
                dropdownIconColor="#00aeef"
              >
                {years.map((y) => (
                  <Picker.Item key={y} label={y} value={y} />
                ))}
              </Picker>
            </View>
          </View>
        </>
      )}

      {/* Nút Tiếp tục */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          (step === 1 && !name.trim()) ||
          (step === 2 && !validatePhoneNumber(phoneNumber)) ||
          (step === 3 && !gender)
            ? styles.disabledButton
            : null,
        ]}
        onPress={handleNext}
        disabled={
          (step === 1 && !name.trim()) ||
          (step === 2 && !validatePhoneNumber(phoneNumber)) ||
          (step === 3 && !gender)
        }
      >
        <Text style={styles.nextButtonText}>{step === 3 ? '✓' : '→'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0068FF',
    marginBottom: 30,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  note: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 30,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedGender: {
    backgroundColor: '#00aeef',
    borderColor: '#00aeef',
  },
  genderText: {
    fontSize: 16,
    color: '#333',
  },
  selectedGenderText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 10,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: '#fff',
    borderRadius: 50,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  backButtonText: {
    color: '#00aeef',
    fontSize: 30,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#00aeef',
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#d1d1d1',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
});